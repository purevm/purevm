import type { Address, Hex, Quantity } from '@/types/shared.types.js';

// ============================================================================
// CALL TRACER — alternative tracer returning a call tree
// ============================================================================

export type DebugCallType =
  | "CALL"
  | "CALLCODE"
  | "STATICCALL"
  | "DELEGATECALL"
  | "CREATE"
  | "CREATE2"
  | "SELFDESTRUCT"
  | "SUICIDE";

export type DebugCallFrame = {
  /** The type of the call. */
  type: DebugCallType;
  /** The address of that initiated the call. */
  from: Address;
  /** The address of the contract that was called. */
  to?: Address;
  /** Value transferred. */
  value?: Quantity;
  /** How much gas was left before the call. */
  gas: Quantity;
  /** How much gas was used by the call. */
  gasUsed: Quantity;
  /** Calldata input. */
  input: "0x" | "0x0" | Hex;
  /** Output of the call, if any. */
  output?: "0x" | "0x0" | Hex;
  /** Error message, if any. */
  error?: string;
  /** Why this call reverted, if it reverted. */
  revertReason?: string;
  /** Recorded child calls. */
  calls?: DebugCallFrame[];
  /** Logs emitted by this call. */
  logs?: DebugCallLogFrame[];
};

/** Represents a recorded log that is emitted during a trace call. */
export type DebugCallLogFrame = {
  /** The address of the contract that was called. */
  address: Address;
  /** The topics of the log. */
  topics: (Hex | Hex[] | null)[];
  /** The data of the log. */
  data: Hex;
  /** The position of the log relative to subcalls within the same trace. */
  position: number;
};