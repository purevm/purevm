import type { JsonValue, RequestOptions, TransportOptions } from "../types.js";

export type WebSocketEvent = {
  data?: unknown;
  code?: number;
  reason?: string;
  error?: unknown;
};

export type WebSocketListener = (event: WebSocketEvent) => void;

export interface WebSocketLike {
  readonly readyState: number;
  /** Set to `"arraybuffer"` on open when present. Blob messages are rejected. */
  binaryType?: string | undefined;
  addEventListener(type: "open" | "message" | "error" | "close", listener: WebSocketListener): void;
  removeEventListener(
    type: "open" | "message" | "error" | "close",
    listener: WebSocketListener,
  ): void;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

export type ReconnectOptions = {
  /** Reconnect attempts after a drop. Defaults to `Infinity`. */
  retries?: number | undefined;
  /** Delay before the first reconnect attempt. Defaults to `100`. */
  delayMs?: number | undefined;
  /** Upper bound for the backoff delay. Defaults to `30_000`. */
  maxDelayMs?: number | undefined;
  /** Backoff multiplier. Defaults to `2`. */
  factor?: number | undefined;
};

export type HeartbeatMethod = "eth_blockNumber" | "eth_chainId" | "net_version";

export type HeartbeatOptions = {
  /** Idle time before a liveness probe is sent. Defaults to `30_000`. */
  intervalMs?: number | undefined;
  /** Maximum wait for the probe response. Defaults to `10_000`. */
  timeoutMs?: number | undefined;
  /** JSON-RPC method used as probe. Defaults to `"eth_chainId"`. */
  method?: HeartbeatMethod | undefined;
};

export type WebSocketTransportOptions = TransportOptions & {
  url: `ws://${string}` | `wss://${string}` | string;
  createWebSocket?: WebSocketFactory;
  onError?: (error: Error) => void;
  /** Automatic reconnection while subscriptions are active. `false` disables it. */
  reconnect?: false | ReconnectOptions | undefined;
  /** Liveness probe for idle connections. `false` disables it. */
  heartbeat?: false | HeartbeatOptions | undefined;
};

export type SubscribeOptions<result> = {
  params: readonly JsonValue[];
  onData(result: result): void;
  onError?: (error: Error) => void;
};

export interface RpcSubscription {
  readonly id: string | undefined;
  unsubscribe(options?: RequestOptions): Promise<boolean>;
}
