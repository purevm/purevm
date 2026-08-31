import type { Address, Hex, Quantity, TransactionHash } from "../../types/primitives.js";

/** Call operation reported by Geth's built-in `callTracer`. */
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
  /** Contract that emitted the log. */
  address: Address;
  /** Non-indexed log data. */
  data: Hex;
  /** Position relative to child calls in this frame. */
  position: number;
  /** Indexed event values emitted by the call. */
  topics: Hex[];
};

export type DebugCallFrame = {
  /** Nested calls made by this frame. */
  calls?: DebugCallFrame[];
  /** Execution error reported by the tracer. */
  error?: string;
  /** Address that initiated the call. */
  from: Address;
  /** Gas available before execution of this call. */
  gas: Quantity;
  /** Gas consumed by this call. */
  gasUsed: Quantity;
  /** Calldata or contract creation bytecode. */
  input: Hex;
  /** Logs emitted directly by this call when `withLog` is enabled. */
  logs?: DebugCallLogFrame[];
  /** Return data produced by the call. */
  output?: Hex;
  /** Decoded revert reason when available. */
  revertReason?: string;
  /** Called address, absent for some creation and self-destruct frames. */
  to?: Address;
  /** EVM call or creation operation represented by this frame. */
  type: DebugCallType;
  /** Amount of wei transferred by the call. */
  value?: Quantity;
};

export type CallTracerConfig = {
  /** Selects Geth's built-in call tracer. */
  tracer: "callTracer";
  /** Options interpreted by the call tracer. */
  tracerConfig?: {
    /** Trace only the top-level call and omit child calls. */
    onlyTopCall?: boolean;
    /** Include logs emitted by each call frame. */
    withLog?: boolean;
  };
  /** Maximum tracing duration expressed as a Go duration string, such as `5s`. */
  timeout?: string;
};

export type DebugBlockTrace = {
  /** Root call frame produced for the transaction. */
  result: DebugCallFrame;
  /** Hash of the transaction represented by this trace. */
  txHash: TransactionHash;
};
