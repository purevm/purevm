import type {
  Address,
  BlockHash,
  Hex,
  Quantity,
  RpcBlock,
  RpcTransaction,
  RpcTransactionReceipt,
  TraceRewardType,
  TransactionHash,
} from "@purevm/rpc-public";

export type Block = Omit<RpcBlock<true>, "transactions">;
export type TransactionsByHash = Record<TransactionHash, RpcTransaction>;
export type ReceiptsByHash = Record<TransactionHash, RpcTransactionReceipt>;

export type BlockResult = {
  block: Block;
  transactions: TransactionsByHash;
};

export type ReceiptsResult = {
  receipts: ReceiptsByHash;
};

type TraceBase = {
  /** Effective execution error, or null when this trace and its ancestors succeeded. */
  error: string | null;
  path: readonly number[];
};

export type CallTrace = TraceBase & {
  from: Address;
  input: Hex;
  output: Hex;
  /** Target address, or null when the provider omitted it. */
  to: Address | null;
  type: "CALL" | "CALLCODE" | "DELEGATECALL" | "STATICCALL";
  value: Quantity;
};

export type CreationTrace = TraceBase & {
  from: Address;
  input: Hex;
  output: Hex;
  /** Created address, or null when creation failed or the provider omitted it. */
  to: Address | null;
  type: "CREATE" | "CREATE2";
  value: Quantity;
};

export type DestructionTrace = TraceBase & {
  from: Address;
  /** Refund address, or null when the provider omitted it. */
  to: Address | null;
  type: "SELFDESTRUCT" | "SUICIDE";
  value: Quantity;
};

export type RewardTrace = TraceBase & {
  rewardType: TraceRewardType;
  to: Address;
  type: "REWARD";
  value: Quantity;
};

export type Trace = CallTrace | CreationTrace | DestructionTrace | RewardTrace;
export type TracesByTransactionHash = Record<TransactionHash, Trace[]>;

export type TracesResult = {
  traces: TracesByTransactionHash;
};

export type ParityBlockTracesResult = TracesResult & {
  blockHash: BlockHash | null;
};

export type ParityBlocksTracesResult = {
  blocks: Record<number, ParityBlockTracesResult>;
};
