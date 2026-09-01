import type {
  BlockHash,
  BlockNumber,
  HttpTransportOptions,
  NewHeadsSubscriptionResult,
  Quantity,
  RequestOptions,
  RpcBlock,
  RpcSubscription,
  SubscriptionHandlers,
  WebSocketTransportOptions,
} from "@purevm/rpc";

export type HeadSource = "http" | "websocket";

/** Minimal latest-chain state retained by the module. */
export type BlockHead = {
  hash: BlockHash;
  number: bigint;
  numberHex: BlockNumber;
};

export type HeadEvent = {
  head: BlockHead;
  source: HeadSource;
  type: "head";
};

export type ReorgEvent = {
  head: BlockHead;
  previous: BlockHead;
  source: HeadSource;
  type: "reorg";
};

export type NewHeadsEvent = HeadEvent | ReorgEvent;

export type HeartbeatOptions = {
  /** Delay between WebSocket liveness checks. */
  intervalMs: number;
  /** JSON-RPC method used to verify WebSocket liveness. */
  method: "eth_blockNumber" | "net_version";
  /** Maximum duration of one heartbeat request. */
  timeoutMs: number;
};

export type PollingOptions = {
  /** Delay without a current WebSocket head before fallback polling starts. */
  delayBeforeStartMs: number;
  /** Delay between HTTP latest-block requests while fallback is active. */
  fetchIntervalMs: number;
};

export type ReconnectOptions = {
  /** Returns the desired delay for a one-based reconnect attempt. */
  delay: (attempt: number) => number;
  /** Largest permitted reconnect delay. */
  maxDelayMs: number;
  /** Smallest permitted reconnect delay. */
  minDelayMs: number;
};

export type NewHeadsOptions = {
  heartbeat: HeartbeatOptions;
  http: HttpTransportOptions;
  onError: (error: Error) => void;
  onHead: (event: HeadEvent) => void;
  onLog?: (message: string) => void;
  onReorg: (event: ReorgEvent) => void;
  polling: PollingOptions;
  reconnect: ReconnectOptions;
  /** Retry and error handling are owned by this module. */
  websocket: Omit<WebSocketTransportOptions, "onError" | "retry">;
};

/** @internal */
export interface NewHeadsHttpClient {
  ethGetBlockByTag(parameters: { blockTag: "latest" }): Promise<RpcLatestBlock | null>;
}

/** @internal */
export interface NewHeadsWebSocketClient {
  close(): void;
  ethBlockNumber(options?: RequestOptions): Promise<Quantity>;
  ethSubscribeNewHeads(
    handlers: SubscriptionHandlers<NewHeadsSubscriptionResult>,
  ): Promise<RpcSubscription>;
  netVersion(options?: RequestOptions): Promise<string>;
}

/** @internal */
export type NewHeadsClientFactory = {
  createHttp(options: HttpTransportOptions): NewHeadsHttpClient;
  createWebSocket(options: WebSocketTransportOptions): NewHeadsWebSocketClient;
};

/** @internal */
export type RpcHead = Pick<NewHeadsSubscriptionResult, "hash" | "number">;
/** @internal */
export type RpcLatestBlock = Pick<RpcBlock<false>, "hash" | "number">;
