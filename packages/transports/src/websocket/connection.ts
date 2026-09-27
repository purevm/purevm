import { createTimeoutContext } from "../common/timeout.js";
import {
  RpcAbortError,
  RpcTimeoutError,
  WebSocketClosedError,
  WebSocketConnectionError,
} from "../errors/index.js";
import { closeMessage, openWebSocket } from "./socket.js";
import type { WebSocketFactory, WebSocketLike } from "./types.js";

export type WebSocketConnectionHandlers = {
  onOpen(): void;
  onMessage(data: unknown): void;
  onError(error: Error): void;
  onClose(error: Error): void;
};

export class WebSocketConnection {
  private readonly url: string;
  private readonly createWebSocket: WebSocketFactory;
  private readonly handlers: WebSocketConnectionHandlers;
  private readonly openTimeoutMs: number;
  private readonly closing = new AbortController();
  private socket?: WebSocketLike;
  private connecting?: Promise<void>;
  private stopped = false;

  /** `openTimeoutMs` bounds the shared opening attempt, independently of any caller. */
  constructor(
    url: string,
    createWebSocket: WebSocketFactory,
    handlers: WebSocketConnectionHandlers,
    openTimeoutMs: number,
  ) {
    this.url = url;
    this.createWebSocket = createWebSocket;
    this.handlers = handlers;
    this.openTimeoutMs = openTimeoutMs;
  }

  get connected(): boolean {
    return this.socket?.readyState === 1;
  }

  /**
   * Waits for an open socket. Callers share one opening attempt that only `close()` cancels, so a
   * caller's `timeoutMs` or `signal` ends its own wait without failing the other callers.
   */
  async connect(timeoutMs: number, signal?: AbortSignal): Promise<void> {
    if (this.stopped) throw new WebSocketClosedError();
    if (this.connected) return;
    this.connecting ??= this.open();
    await waitForConnection(this.connecting, timeoutMs, signal);
  }

  send(data: string): void {
    if (!this.socket || !this.connected) {
      throw new WebSocketConnectionError("WebSocket is not open.");
    }
    try {
      this.socket.send(data);
    } catch (cause) {
      throw new WebSocketConnectionError("WebSocket send failed.", cause);
    }
  }

  close(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.closing.abort();
    this.socket?.close(1_000, "Transport closed");
    this.socket = undefined;
  }

  /** Detaches the current socket immediately, without waiting for a close handshake. */
  drop(error: Error): void {
    const socket = this.socket;
    if (!socket) return;
    this.socket = undefined;
    socket.close(4_000, "Connection dropped");
    this.handlers.onClose(error);
  }

  private open(): Promise<void> {
    const connecting = openWebSocket(
      this.url,
      this.createWebSocket,
      this.openTimeoutMs,
      this.closing.signal,
    )
      .then(
        (socket) => {
          if (this.stopped) {
            socket.close(1_000, "Transport closed");
            throw new WebSocketClosedError();
          }
          this.socket = socket;
          this.listen(socket);
          this.handlers.onOpen();
          return undefined;
        },
        (error: unknown) => {
          throw this.stopped ? new WebSocketClosedError() : error;
        },
      )
      .finally(() => {
        if (this.connecting === connecting) this.connecting = undefined;
      });
    // The attempt may outlive every caller that awaited it.
    connecting.catch(() => undefined);
    return connecting;
  }

  private listen(socket: WebSocketLike): void {
    socket.addEventListener("message", (event) => {
      if (this.socket === socket) this.handlers.onMessage(event.data);
    });
    socket.addEventListener("error", (event) => {
      if (this.socket === socket) {
        this.handlers.onError(new WebSocketConnectionError(undefined, event.error));
      }
    });
    socket.addEventListener("close", (event) => {
      if (this.socket !== socket) return;
      this.socket = undefined;
      this.handlers.onClose(new WebSocketConnectionError(closeMessage(event)));
    });
  }
}

async function waitForConnection(
  connecting: Promise<void>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<void> {
  const timeout = createTimeoutContext(timeoutMs, signal);
  try {
    await new Promise<void>((resolve, reject) => {
      const stop = () => {
        reject(
          timeout.timedOut
            ? new RpcTimeoutError(timeoutMs, timeout.signal.reason)
            : new RpcAbortError(signal?.reason),
        );
      };
      if (timeout.signal.aborted) stop();
      timeout.signal.addEventListener("abort", stop, { once: true });
      connecting.then(resolve, reject).finally(() => {
        timeout.signal.removeEventListener("abort", stop);
      });
    });
  } finally {
    timeout.dispose();
  }
}
