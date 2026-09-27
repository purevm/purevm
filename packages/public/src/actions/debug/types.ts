import type { JsonValue } from "@purevm/transports";

import type {
  Address,
  BlockHash,
  Hash,
  Hex,
  Quantity,
  TransactionHash,
} from "../../types/primitives.js";
import type { BlockOverrides, RpcBlock, StateOverride } from "../eth/types.js";
import type { TraceEntry } from "../trace/types.js";

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

/** Options shared by every `debug_trace*` configuration. */
type TraceOptions = {
  /** Maximum tracing duration expressed as a Go duration string, such as `5s`. */
  timeout?: string | undefined;
  /** Blocks the node may re-execute to rebuild missing historical state. */
  reexec?: number | undefined;
};

/** Built-in `callTracer`: nested call frames. */
export type CallTracerConfig = TraceOptions & {
  tracer: "callTracer";
  tracerConfig?:
    | {
        /** Trace only the top-level call and omit child calls. */
        onlyTopCall?: boolean | undefined;
        /** Include logs emitted by each call frame. */
        withLog?: boolean | undefined;
      }
    | undefined;
};

/** Built-in `flatCallTracer`: Parity-style flat trace entries. */
export type FlatCallTracerConfig = TraceOptions & {
  tracer: "flatCallTracer";
  tracerConfig?:
    | {
        /** Report errors with Parity wording instead of Geth wording. */
        convertParityErrors?: boolean | undefined;
        /** Include calls to precompiled contracts. */
        includePrecompiles?: boolean | undefined;
      }
    | undefined;
};

type PrestateOptions = {
  /** Omit contract bytecode from the result. */
  disableCode?: boolean | undefined;
  /** Omit storage slots from the result. */
  disableStorage?: boolean | undefined;
};

/** Built-in `prestateTracer`: every account touched, as it was before execution. */
export type PrestateTracerConfig = TraceOptions & {
  tracer: "prestateTracer";
  tracerConfig?: (PrestateOptions & { diffMode?: false | undefined }) | undefined;
};

/** Built-in `prestateTracer` in diff mode: touched accounts before and after execution. */
export type PrestateDiffTracerConfig = TraceOptions & {
  tracer: "prestateTracer";
  tracerConfig: PrestateOptions & { diffMode: true };
};

/** Built-in `4byteTracer`: counts of called function selectors and calldata sizes. */
export type FourByteTracerConfig = TraceOptions & { tracer: "4byteTracer" };

/** Built-in `noopTracer`: runs the tracing machinery and returns an empty object. */
export type NoopTracerConfig = TraceOptions & { tracer: "noopTracer" };

/** Built-in `muxTracer`: runs several built-in tracers in one pass, keyed by tracer name. */
export type MuxTracerConfig = TraceOptions & {
  tracer: "muxTracer";
  tracerConfig: {
    "4byteTracer"?: Record<string, never> | undefined;
    callTracer?: CallTracerConfig["tracerConfig"];
    flatCallTracer?: FlatCallTracerConfig["tracerConfig"];
    noopTracer?: Record<string, never> | undefined;
    prestateTracer?:
      | PrestateTracerConfig["tracerConfig"]
      | PrestateDiffTracerConfig["tracerConfig"];
  };
};

/** Default opcode-level struct logger, selected by omitting `tracer`. */
export type StructLoggerConfig = TraceOptions & {
  /** Omit the EVM stack from each step. */
  disableStack?: boolean | undefined;
  /** Omit storage from each step. */
  disableStorage?: boolean | undefined;
  /** Include EVM memory in each step. */
  enableMemory?: boolean | undefined;
  /** Include return data in each step. */
  enableReturnData?: boolean | undefined;
  /** Maximum number of steps to record. `0` means unlimited. */
  limit?: number | undefined;
};

/** Custom JavaScript tracer whose source code is sent as `tracer`. */
export type JavaScriptTracerConfig = TraceOptions & {
  tracer: string;
  tracerConfig?: JsonValue | undefined;
};

export type DebugTraceConfig =
  | CallTracerConfig
  | FlatCallTracerConfig
  | FourByteTracerConfig
  | JavaScriptTracerConfig
  | MuxTracerConfig
  | NoopTracerConfig
  | PrestateDiffTracerConfig
  | PrestateTracerConfig
  | StructLoggerConfig;

/** `debug_traceCall` configuration: a tracer plus overrides applied before the call. */
export type DebugTraceCallConfig = DebugTraceConfig & {
  /** Header fields replaced for the traced call. */
  blockOverrides?: BlockOverrides | undefined;
  /** Account state replaced before the traced call. */
  stateOverrides?: StateOverride | undefined;
};

/** Account state reported by `prestateTracer`. Absent fields are empty or unchanged. */
export type DebugPrestateAccount = {
  balance?: Quantity | undefined;
  code?: Hex | undefined;
  codeHash?: Hash | undefined;
  nonce?: number | undefined;
  storage?: { readonly [slot: Hex]: Hex } | undefined;
};

export type DebugPrestate = { readonly [address: Address]: DebugPrestateAccount };

export type DebugPrestateDiff = { post: DebugPrestate; pre: DebugPrestate };

/** Counts keyed by `<selector>-<calldata size>`, such as `0x27dc297e-128`. */
export type DebugFourByteResult = { readonly [selectorAndSize: string]: number };

/** One EVM step recorded by the struct logger. */
export type DebugStructLog = {
  depth: number;
  error?: string | undefined;
  gas: number;
  gasCost: number;
  memory?: readonly string[] | undefined;
  op: string;
  pc: number;
  refund?: number | undefined;
  returnData?: string | undefined;
  stack?: readonly string[] | undefined;
  storage?: { readonly [slot: string]: string } | undefined;
};

export type DebugStructLogResult = {
  failed: boolean;
  gas: number;
  returnValue: string;
  structLogs: readonly DebugStructLog[];
};

/** Result type selected by a tracer configuration. */
export type DebugTraceResult<config extends DebugTraceConfig> = config extends {
  tracer: "callTracer";
}
  ? DebugCallFrame
  : config extends { tracer: "flatCallTracer" }
    ? TraceEntry[]
    : config extends { tracer: "prestateTracer"; tracerConfig: { diffMode: true } }
      ? DebugPrestateDiff
      : config extends { tracer: "prestateTracer" }
        ? DebugPrestate
        : config extends { tracer: "4byteTracer" }
          ? DebugFourByteResult
          : config extends { tracer: "noopTracer" }
            ? Record<string, never>
            : config extends { tracer: "muxTracer"; tracerConfig: infer mux }
              ? {
                  [name in keyof mux & string]: DebugTraceResult<
                    Extract<DebugTraceConfig, { tracer: name }> & { tracerConfig: mux[name] }
                  >;
                }
              : config extends { tracer: string }
                ? unknown
                : DebugStructLogResult;

/**
 * One transaction of a `debug_traceBlock*` response. A transaction the tracer could not
 * process, for example after `timeout`, carries `error` instead of `result`.
 */
export type DebugBlockTrace<result = DebugCallFrame> =
  | { error?: undefined; result: result; txHash: TransactionHash }
  | { error: string; result?: undefined; txHash: TransactionHash };

/** Block rejected by the node, returned by `debug_getBadBlocks`. */
export type DebugBadBlock = {
  /** Decoded block with full transactions. */
  block: RpcBlock<true>;
  /** Hash of the rejected block. */
  hash: BlockHash;
  /** RLP-encoded block. */
  rlp: Hex;
};
