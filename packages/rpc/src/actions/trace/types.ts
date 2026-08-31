import type { Address, Hash, Hex, Quantity } from "../../types/primitives.js";

/** Call operation represented by a parity-style trace. */
export type TraceCallType = "call" | "callcode" | "delegatecall" | "staticcall";
/** Contract creation operation represented by a parity-style trace. */
export type TraceCreateType = "create" | "create2";
/** Block reward category represented by a parity-style trace. */
export type TraceRewardType = "block" | "uncle";

export type TraceCallAction = {
  /** EVM call operation. */
  callType: TraceCallType;
  /** Address that initiated the call. */
  from: Address;
  /** Gas supplied to the call. */
  gas: Quantity;
  /** Call input data. */
  input: Hex;
  /** Address receiving the call. */
  to: Address;
  /** Amount of wei transferred. */
  value: Quantity;
};

export type TraceCreateAction = {
  /** Creation opcode used when supplied by the client. */
  creationMethod?: TraceCreateType;
  /** Address that initiated contract creation. */
  from: Address;
  /** Gas supplied for contract creation. */
  gas: Quantity;
  /** Contract initialization bytecode. */
  init: Hex;
  /** Amount of wei transferred to the new contract. */
  value: Quantity;
};

export type TraceSuicideAction = {
  /** Address of the contract being destroyed. */
  address: Address;
  /** Remaining balance transferred to the refund address. */
  balance: Quantity;
  /** Address receiving the remaining balance. */
  refundAddress: Address;
};

export type TraceRewardAction = {
  /** Address receiving the reward. */
  author: Address;
  /** Whether this is a block or uncle reward. */
  rewardType: TraceRewardType;
  /** Reward amount in wei. */
  value: Quantity;
};

export type TraceCallResult = {
  /** Gas consumed by the call. */
  gasUsed: Quantity;
  /** Return data produced by the call. */
  output: Hex;
};

export type TraceCreateResult = {
  /** Address of the created contract. */
  address: Address;
  /** Runtime bytecode stored at the created address. */
  code: Hex;
  /** Gas consumed by contract creation. */
  gasUsed: Quantity;
};

type TraceBase = {
  /** Execution error, when the traced operation failed. */
  error?: string;
  /** Number of direct child traces. */
  subtraces: number;
  /** Path locating this trace in the transaction call tree. */
  traceAddress: number[];
};

type TraceBlockBase = TraceBase & {
  /** Hash of the block containing this trace. */
  blockHash: Hash;
  /** Decimal block number returned by parity-style trace APIs. */
  blockNumber: number;
};

type TraceTransactionBase = TraceBlockBase & {
  /** Hash of the transaction containing this trace. */
  transactionHash: Hash;
  /** Decimal transaction position within the block. */
  transactionPosition: number;
};

export type TraceCallEntry = TraceTransactionBase & {
  /** Details of the call operation. */
  action: TraceCallAction;
  /** Call result, or null after an exceptional halt. */
  result: TraceCallResult | null;
  /** Discriminator for a call trace. */
  type: "call";
};

export type TraceCreateEntry = TraceTransactionBase & {
  /** Details of the contract creation operation. */
  action: TraceCreateAction;
  /** Creation result, or null after an exceptional halt. */
  result: TraceCreateResult | null;
  /** Discriminator for a contract creation trace. */
  type: "create";
};

export type TraceSuicideEntry = TraceTransactionBase & {
  /** Details of the self-destruct operation. */
  action: TraceSuicideAction;
  /** Self-destruct traces do not have a result object. */
  result: null;
  /** Discriminator used by parity-style APIs for self-destruct traces. */
  type: "suicide";
};

export type TraceRewardEntry = TraceBlockBase & {
  /** Details of the block or uncle reward. */
  action: TraceRewardAction;
  /** Reward traces do not have a result object. */
  result: null;
  /** Discriminator for a reward trace. */
  type: "reward";
};

/** Any entry returned by `trace_block` or `trace_filter`. */
export type TraceEntry = TraceCallEntry | TraceCreateEntry | TraceRewardEntry | TraceSuicideEntry;
