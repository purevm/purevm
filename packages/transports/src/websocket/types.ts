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
  addEventListener(type: "open" | "message" | "error" | "close", listener: WebSocketListener): void;
  removeEventListener(
    type: "open" | "message" | "error" | "close",
    listener: WebSocketListener,
  ): void;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

export type WebSocketTransportOptions = TransportOptions & {
  url: `ws://${string}` | `wss://${string}` | string;
  createWebSocket?: WebSocketFactory;
  onError?: (error: Error) => void;
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
