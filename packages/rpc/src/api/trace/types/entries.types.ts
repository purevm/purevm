import type { Hash } from '@/types/shared.types.js';
import type { TraceCallAction, TraceCreateAction, TraceSuicideAction, TraceRewardAction } from "./actions.types.js";
import type { TraceCallResult, TraceCreateResult } from "./results.types.js";

// ============================================================================
// BASE
// ============================================================================

type TraceBase = {
  /** The number of subtraces */
  subtraces: number;
  /** The trace address */
  traceAddress: number[];
  /** The error of the trace (if any) */
  error?: string;
};

type TraceBlockBase = TraceBase & {
  /** The hash of the block */
  blockHash: Hash;
  /** The number of the block */
  blockNumber: number;
};

type TraceTransactionBase = TraceBlockBase & {
  /** The hash of the transaction */
  transactionHash: Hash;
  /** The position of the transaction in the block */
  transactionPosition: number;
};

// ============================================================================
// ENTRIES
// ============================================================================

export type TraceCallEntry = TraceTransactionBase & {
  /** The type of trace */
  type: "call";
  /** The action of the trace */
  action: TraceCallAction;
  /** The result of the trace (null if OOG/exception hard) */
  result: TraceCallResult | null;
}

export type TraceCreateEntry = TraceTransactionBase & {
  /** The type of trace */
  type: "create";
  /** The action of the trace */
  action: TraceCreateAction;
  /** The result of the trace (null if OOG/exception hard) */
  result: TraceCreateResult | null;
}

export type TraceSuicideEntry = TraceTransactionBase & {
  /** The type of trace */
  type: "suicide";
  /** The action of the trace */
  action: TraceSuicideAction;
  /** The result of the trace */
  result: null;
}

export type TraceRewardEntry = TraceBlockBase & {
  /** The type of trace */
  type: "reward";
  /** The action of the trace */
  action: TraceRewardAction;
  /** The result of the trace */
  result: null;
}

// ============================================================================
// TRACE_BLOCK
// ============================================================================

export type TraceEntry =
  | TraceCallEntry
  | TraceCreateEntry
  | TraceSuicideEntry
  | TraceRewardEntry;