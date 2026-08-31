import { WebSocketClosedError, WebSocketConnectionError } from "../errors/index.js";
import { closeMessage, openWebSocket } from "./socket.js";
import type { WebSocketFactory, WebSocketLike } from "./types.js";

export type WebSocketConnectionHandlers = {
  onMessage(data: unknown): void;
  onError(error: Error): void;
  onClose(error: Error): void;
};

export class WebSocketConnection {
  private readonly url: string;
  private readonly createWebSocket: WebSocketFactory;
  private readonly handlers: WebSocketConnectionHandlers;
  private socket?: WebSocketLike;
  private connecting?: Promise<void>;
  private stopped = false;

  constructor(
    url: string,
    createWebSocket: WebSocketFactory,
    handlers: WebSocketConnectionHandlers,
  ) {
    this.url = url;
    this.createWebSocket = createWebSocket;
    this.handlers = handlers;
  }

  get connected(): boolean {
    return this.socket?.readyState === 1;
  }

  async connect(timeoutMs: number, signal?: AbortSignal): Promise<void> {
    if (this.stopped) throw new WebSocketClosedError();
    if (this.connected) return;
    if (this.connecting) return this.connecting;

    const connecting = openWebSocket(this.url, this.createWebSocket, timeoutMs, signal).then(
      (socket) => {
        if (this.stopped) {
          socket.close(1_000, "Transport closed");
          throw new WebSocketClosedError();
        }
        this.socket = socket;
        this.listen(socket);
        return undefined;
      },
    );
    this.connecting = connecting;

    try {
      await connecting;
    } finally {
      if (this.connecting === connecting) this.connecting = undefined;
    }
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
    this.socket?.close(1_000, "Transport closed");
    this.socket = undefined;
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
