import {
  WebSocketConnectionError,
  type RpcSubscription,
  type WebSocketEvent,
  type WebSocketFactory,
  type WebSocketLike,
  type WebSocketTransportOptions,
} from "@purevm/rpc";

import type { HeartbeatOptions, NewBlocksWebSocketClient, RpcBlockHeader } from "./types.js";
import { toError } from "./utils.js";

export type WebSocketSessionOptions = {
  createClient: (options: WebSocketTransportOptions) => NewBlocksWebSocketClient;
  heartbeat: HeartbeatOptions;
  onFailure: (error: Error) => void;
  /** Returns true only when the header is current enough to prove subscription health. */
  onHead: (head: RpcBlockHeader) => boolean;
  staleAfterMs: number;
  websocket: Omit<WebSocketTransportOptions, "onError" | "retry">;
};

export class WebSocketSession {
  private active = false;
  private client?: NewBlocksWebSocketClient;
  private failed = false;
  private heartbeatTimer?: ReturnType<typeof setTimeout>;
  private staleTimer?: ReturnType<typeof setTimeout>;
  private subscription?: RpcSubscription;

  constructor(private readonly options: WebSocketSessionOptions) {}

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
      this.scheduleHeartbeat();
    } catch (cause) {
      const error = toError(cause, "Failed to connect and subscribe to new heads");
      this.fail(error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.active && !this.client && !this.subscription) return;

    this.active = false;
    this.clearTimers();
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
    this.clearTimers();
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

  private scheduleHeartbeat(): void {
    this.clearHeartbeatTimer();
    this.heartbeatTimer = setTimeout(
      () => void this.runHeartbeat(),
      this.options.heartbeat.intervalMs,
    );
  }

  private async runHeartbeat(): Promise<void> {
    const client = this.client;
    if (!this.active || this.failed || !client) return;

    try {
      const requestOptions = { timeoutMs: this.options.heartbeat.timeoutMs };
      if (this.options.heartbeat.method === "eth_blockNumber") {
        await client.ethBlockNumber(requestOptions);
      } else {
        await client.netVersion(requestOptions);
      }
      if (this.active && !this.failed) this.scheduleHeartbeat();
    } catch (cause) {
      this.fail(toError(cause, "WebSocket heartbeat failed"));
    }
  }

  private resetStaleTimer(): void {
    this.clearStaleTimer();
    this.staleTimer = setTimeout(() => {
      this.fail(new Error(`No WebSocket block received for ${this.options.staleAfterMs}ms`));
    }, this.options.staleAfterMs);
  }

  private fail(error: Error): void {
    if (!this.active || this.failed) return;
    this.failed = true;
    this.clearTimers();
    this.options.onFailure(error);
  }

  private clearTimers(): void {
    this.clearHeartbeatTimer();
    this.clearStaleTimer();
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
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
