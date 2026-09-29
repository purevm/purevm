import {
  WebSocketConnectionError,
  type RpcSubscription,
  type WebSocketEvent,
  type WebSocketFactory,
  type WebSocketLike,
  type WebSocketTransportOptions,
} from "@purevm/rpc-public";

import type { NewBlocksOptions, NewBlocksWebSocketClient, RpcBlockHeader } from "./types.js";
import { toError } from "./utils.js";

export type WebSocketSessionOptions = {
  createClient: (options: WebSocketTransportOptions) => NewBlocksWebSocketClient;
  onFailure: (error: Error) => void;
  /** Returns true when the header is recent enough to prove the subscription is alive. */
  onHead: (head: RpcBlockHeader) => boolean;
  staleAfterMs: number;
  websocket: NewBlocksOptions["websocket"];
};

/**
 * One WebSocket connection with one `newHeads` subscription. It fails once, on the first socket
 * close, transport error, subscription error, or `staleAfterMs` without a current header. Liveness
 * of an idle socket is checked by the transport heartbeat.
 */
export class WebSocketSession {
  private active = false;
  private client?: NewBlocksWebSocketClient | undefined;
  private failed = false;
  private staleTimer?: ReturnType<typeof setTimeout> | undefined;
  private subscription?: RpcSubscription | undefined;
  private readonly options: WebSocketSessionOptions;

  constructor(options: WebSocketSessionOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.failed = false;

    try {
      const client = this.options.createClient(this.createTransportOptions());
      this.client = client;
      const subscription = await client.ethSubscribeNewHeads({
        onData: (head) => this.handleHead(head),
        onError: (error) => this.fail(error),
      });

      if (!this.active) {
        await discardSubscription(subscription, client);
        return;
      }

      this.subscription = subscription;
      this.resetStaleTimer();
    } catch (cause) {
      const error = toError(cause, "Failed to connect and subscribe to new heads");
      this.fail(error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.active && !this.client && !this.subscription) return;

    this.active = false;
    this.clearStaleTimer();
    const client = this.client;
    const subscription = this.subscription;
    this.client = undefined;
    this.subscription = undefined;

    try {
      if (subscription) await subscription.unsubscribe();
    } finally {
      client?.close();
    }
  }

  close(): void {
    this.active = false;
    this.clearStaleTimer();
    const client = this.client;
    this.client = undefined;
    this.subscription = undefined;
    client?.close();
  }

  private createTransportOptions(): WebSocketTransportOptions {
    const createWebSocket = observeSocket(
      this.options.websocket.createWebSocket ?? defaultWebSocketFactory,
      (event) => {
        const code = event.code === undefined ? "" : ` (${event.code})`;
        const reason = event.reason ? `: ${event.reason}` : "";
        this.fail(new WebSocketConnectionError(`WebSocket connection closed${code}${reason}.`));
      },
    );

    return {
      ...this.options.websocket,
      createWebSocket,
      onError: (error) => this.fail(error),
      reconnect: false,
      retry: false,
    };
  }

  private handleHead(head: RpcBlockHeader): void {
    if (!this.active || this.failed) return;
    try {
      if (this.options.onHead(head)) this.resetStaleTimer();
    } catch (cause) {
      this.fail(toError(cause, "Failed to process WebSocket block header"));
    }
  }

  private resetStaleTimer(): void {
    this.clearStaleTimer();
    this.staleTimer = setTimeout(() => {
      this.fail(new Error(`No new WebSocket block received for ${this.options.staleAfterMs}ms`));
    }, this.options.staleAfterMs);
  }

  private fail(error: Error): void {
    if (!this.active || this.failed) return;
    this.failed = true;
    this.clearStaleTimer();
    this.options.onFailure(error);
  }

  private clearStaleTimer(): void {
    if (this.staleTimer) clearTimeout(this.staleTimer);
    this.staleTimer = undefined;
  }
}

async function discardSubscription(
  subscription: RpcSubscription,
  client: NewBlocksWebSocketClient,
): Promise<void> {
  try {
    await subscription.unsubscribe();
  } catch {
    // Closing a stale socket releases its server-side subscription.
  }
  client.close();
}

function observeSocket(factory: WebSocketFactory, onClose: (event: WebSocketEvent) => void) {
  return (url: string): WebSocketLike => {
    const socket = factory(url);
    socket.addEventListener("close", onClose);
    return socket;
  };
}

function defaultWebSocketFactory(url: string): WebSocketLike {
  const WebSocketConstructor = (
    globalThis as unknown as { WebSocket?: new (url: string) => WebSocketLike }
  ).WebSocket;
  if (!WebSocketConstructor) {
    throw new WebSocketConnectionError("No WebSocket implementation available.");
  }
  return new WebSocketConstructor(url);
}
