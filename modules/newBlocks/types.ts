import type {
  BlockHash,
  BlockNumber,
  HttpTransportOptions,
  NewHeadsSubscriptionResult,
  Quantity,
  RpcBlock,
  RpcSubscription,
  SubscriptionHandlers,
  WebSocketTransportOptions,
} from "@purevm/rpc-public";

/** Where a header came from: the subscription or the HTTP fallback poll. */
export type BlockSource = "http" | "websocket";

/** Canonical header retained and emitted by the stream. */
export type BlockHeader = {
  hash: BlockHash;
  number: bigint;
  numberHex: BlockNumber;
  parentHash: BlockHash;
  /** Unix milliseconds at which the header was received. */
  receivedAt: number;
  timestamp: bigint;
  timestampHex: Quantity;
};

/** The first header, or the next height extending the previous header. */
export type BlockEvent = {
  block: BlockHeader;
  previous?: BlockHeader | undefined;
  source: BlockSource;
  type: "block";
};

/**
 * The chain switched branch. `replacement`: a height already emitted arrived with another hash
 * (`replaced` is the header emitted before at that height). `parent-mismatch`: the next height
 * does not extend `previous`.
 */
export type ReorgEvent = {
  block: BlockHeader;
  kind: "parent-mismatch" | "replacement";
  previous: BlockHeader;
  replaced?: BlockHeader | undefined;
  source: BlockSource;
  type: "reorg";
};

/**
 * `block` is newer than the next height: the heights in `missing` were never seen. They are not
 * fetched; request them with `eth_getBlockByNumber` if every block is needed.
 */
export type GapEvent = {
  block: BlockHeader;
  missing: { count: bigint; from: bigint; to: bigint };
  previous: BlockHeader;
  source: BlockSource;
  type: "gap";
};

export type NewBlocksEvent = BlockEvent | GapEvent | ReorgEvent;

export type PollingOptions = {
  /** Silence, without a newer WebSocket header, after which HTTP polling starts. */
  staleAfterMs: number;
  /** Delay between HTTP latest-block requests while polling. Defaults to `staleAfterMs`. */
  intervalMs?: number | undefined;
};

export type ReconnectOptions = {
  /** Returns the delay for a one-based reconnect attempt. */
  delay: (attempt: number) => number;
  maxDelayMs: number;
  minDelayMs: number;
};

export type NewBlocksOptions = {
  /** HTTP endpoint used for fallback polling. It may differ from the WebSocket one. */
  http: HttpTransportOptions;
  /** Recent headers remembered to tell duplicates from replacements. Defaults to `128`. */
  historySize?: number | undefined;
  onError: (error: Error) => void;
  onEvent: (event: NewBlocksEvent) => void;
  onLog?: ((message: string) => void) | undefined;
  polling: PollingOptions;
  reconnect: ReconnectOptions;
  /** Reconnection and retries are owned by this module; set `heartbeat` here to tune liveness. */
  websocket: Omit<WebSocketTransportOptions, "onError" | "reconnect" | "retry">;
};

/** @internal */
export type RpcBlockHeader = Pick<
  NewHeadsSubscriptionResult,
  "hash" | "number" | "parentHash" | "timestamp"
>;

/** @internal */
export type RpcLatestBlock = Pick<RpcBlock<false>, "hash" | "number" | "parentHash" | "timestamp">;

/** @internal */
export type NewBlocksHttpClient = {
  ethGetBlockByTag(parameters: { blockTag: "latest" }): Promise<RpcLatestBlock | null>;
};

/** @internal */
export type NewBlocksWebSocketClient = {
  close(): void;
  ethSubscribeNewHeads(
    handlers: SubscriptionHandlers<NewHeadsSubscriptionResult>,
  ): Promise<RpcSubscription>;
};

/** @internal */
export type NewBlocksClientFactory = {
  createHttp(options: HttpTransportOptions): NewBlocksHttpClient;
  createWebSocket(options: WebSocketTransportOptions): NewBlocksWebSocketClient;
};
