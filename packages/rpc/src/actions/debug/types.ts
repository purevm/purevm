import type { Address, Hex, Quantity, TransactionHash } from "../../types/primitives.js";

export type DebugCallType =
  | "CALL"
  | "CALLCODE"
  | "CREATE"
  | "CREATE2"
  | "DELEGATECALL"
  | "SELFDESTRUCT"
  | "STATICCALL"
  | "SUICIDE";

export type DebugCallLogFrame = {
  address: Address;
  data: Hex;
  position: number;
  topics: Hex[];
};

export type DebugCallFrame = {
  calls?: DebugCallFrame[];
  error?: string;
  from: Address;
  gas: Quantity;
  gasUsed: Quantity;
  input: Hex;
  logs?: DebugCallLogFrame[];
  output?: Hex;
  revertReason?: string;
  to?: Address;
  type: DebugCallType;
  value?: Quantity;
};

export type CallTracerConfig = {
  tracer: "callTracer";
  tracerConfig?: {
    onlyTopCall?: boolean;
    withLog?: boolean;
  };
  timeout?: string;
};

export type DebugBlockTrace = {
  result: DebugCallFrame;
  txHash: TransactionHash;
};
