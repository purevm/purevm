import type { Address, Hash, Hex, Quantity } from "../../types/primitives.js";

export type TraceCallType = "call" | "callcode" | "delegatecall" | "staticcall";
export type TraceCreateType = "create" | "create2";
export type TraceRewardType = "block" | "uncle";

export type TraceCallAction = {
  callType: TraceCallType;
  from: Address;
  gas: Quantity;
  input: Hex;
  to: Address;
  value: Quantity;
};

export type TraceCreateAction = {
  creationMethod?: TraceCreateType;
  from: Address;
  gas: Quantity;
  init: Hex;
  value: Quantity;
};

export type TraceSuicideAction = {
  address: Address;
  balance: Quantity;
  refundAddress: Address;
};

export type TraceRewardAction = {
  author: Address;
  rewardType: TraceRewardType;
  value: Quantity;
};

export type TraceCallResult = { gasUsed: Quantity; output: Hex };
export type TraceCreateResult = { address: Address; code: Hex; gasUsed: Quantity };

type TraceBase = {
  error?: string;
  subtraces: number;
  traceAddress: number[];
};

type TraceBlockBase = TraceBase & {
  blockHash: Hash;
  blockNumber: number;
};

type TraceTransactionBase = TraceBlockBase & {
  transactionHash: Hash;
  transactionPosition: number;
};

export type TraceCallEntry = TraceTransactionBase & {
  action: TraceCallAction;
  result: TraceCallResult | null;
  type: "call";
};

export type TraceCreateEntry = TraceTransactionBase & {
  action: TraceCreateAction;
  result: TraceCreateResult | null;
  type: "create";
};

export type TraceSuicideEntry = TraceTransactionBase & {
  action: TraceSuicideAction;
  result: null;
  type: "suicide";
};

export type TraceRewardEntry = TraceBlockBase & {
  action: TraceRewardAction;
  result: null;
  type: "reward";
};

export type TraceEntry = TraceCallEntry | TraceCreateEntry | TraceRewardEntry | TraceSuicideEntry;

export type TraceFilterParameters = {
  after?: number;
  count?: number;
  fromAddress?: readonly Address[];
  fromBlock?: import("./primitives.js").BlockNumberOrTag;
  toAddress?: readonly Address[];
  toBlock?: import("./primitives.js").BlockNumberOrTag;
};
