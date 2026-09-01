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

export type BlockSource = "http" | "websocket";

/** Minimal canonical header retained by the stream. */
export type BlockHeader = {
  hash: BlockHash;
  number: bigint;
  numberHex: BlockNumber;
  parentHash: BlockHash;
  receivedAt: number;
  timestamp: bigint;
  timestampHex: Quantity;
};

export type BlockEvent = {
  block: BlockHeader;
  previous?: BlockHeader;
  source: BlockSource;
  type: "block";
};

export type GapEvent = {
  block: BlockHeader;
  missing: {
    count: bigint;
    from: bigint;
    to: bigint;
  };
  previous: BlockHeader;
  source: BlockSource;
  type: "gap";
};

export type ReorgEvent = {
  block: BlockHeader;
  kind: "parent-mismatch" | "replacement";
  previous: BlockHeader;
  source: BlockSource;
  type: "reorg";
};

export type NewBlocksEvent = BlockEvent | GapEvent | ReorgEvent;

export type HeartbeatOptions = {
  intervalMs: number;
  method: "eth_blockNumber" | "net_version";
  timeoutMs: number;
};

export type PollingOptions = {
  /** Maximum silence before WebSocket is considered stale and HTTP polling starts. */
  staleAfterMs: number;
  /** Delay between latest-block requests while fallback polling is active. */
  intervalMs: number;
};

export type ReconnectOptions = {
  /** Returns the delay for a one-based reconnect attempt. */
  delay: (attempt: number) => number;
  maxDelayMs: number;
  minDelayMs: number;
};

export type NewBlocksOptions = {
  heartbeat: HeartbeatOptions;
  http: HttpTransportOptions;
  onError: (error: Error) => void;
  onEvent: (event: NewBlocksEvent) => void;
  onLog?: (message: string) => void;
  polling: PollingOptions;
  reconnect: ReconnectOptions;
  /** Retry and reconnect behavior are owned by this module. */
  websocket: Omit<WebSocketTransportOptions, "onError" | "retry">;
};

/** @internal */
export type RpcBlockHeader = Pick<
  NewHeadsSubscriptionResult,
  "hash" | "number" | "parentHash" | "timestamp"
>;

/** @internal */
export type RpcLatestBlock = Pick<RpcBlock<false>, "hash" | "number" | "parentHash" | "timestamp">;

/** @internal */
export interface NewBlocksHttpClient {
  ethGetBlockByTag(parameters: { blockTag: "latest" }): Promise<RpcLatestBlock | null>;
}

/** @internal */
export interface NewBlocksWebSocketClient {
  close(): void;
  ethBlockNumber(options?: RequestOptions): Promise<Quantity>;
  ethSubscribeNewHeads(
    handlers: SubscriptionHandlers<NewHeadsSubscriptionResult>,
  ): Promise<RpcSubscription>;
  netVersion(options?: RequestOptions): Promise<string>;
}

/** @internal */
export type NewBlocksClientFactory = {
  createHttp(options: HttpTransportOptions): NewBlocksHttpClient;
  createWebSocket(options: WebSocketTransportOptions): NewBlocksWebSocketClient;
};
