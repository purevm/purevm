import type {
  BlockHash,
  HttpRequestOptions,
  RpcBlock,
  RpcLog,
  RpcTransaction,
  TraceEntry,
  TraceRewardEntry,
  TransactionHash,
} from "@purevm/public";

export type BlockData = Omit<RpcBlock<true>, "transactions">;
export type TransactionTrace = Exclude<TraceEntry, TraceRewardEntry>;

export type FetchedTransaction = {
  /** Error of the top-level call when the transaction reverted, otherwise `null`. */
  error: string | null;
  logs: RpcLog[];
  traces: TransactionTrace[];
  transaction: RpcTransaction;
  transactionHash: TransactionHash;
  transactionIndex: number;
  /** Receipt status derived from the top-level trace: `reverted` when it has an error. */
  status: "reverted" | "success";
};

export type FetchedBlock = {
  block: BlockData;
  blockHash: BlockHash;
  blockNumber: bigint;
  rewards: TraceRewardEntry[];
  transactions: FetchedTransaction[];
};

export type FetchBlocksResult = {
  blocks: FetchedBlock[];
};

export type FetchBlocksOptions = {
  /** Largest number of simultaneous requests of any kind, split ranges included. */
  concurrency?: number;
  fromBlock: bigint;
  /** Split a logs range when a response reaches this provider limit. */
  maxLogsPerRequest?: number;
  /** Request options shared by every RPC call. */
  requestOptions?: HttpRequestOptions;
  toBlock: bigint;
  /** `trace_filter` page size sent as `count`; later pages use `after`. */
  tracePageSize?: number;
};
