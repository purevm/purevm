import type { DestructionTrace, CreationTrace, CallTrace } from '../../api/getBlocksTraces.types.js';

// ===========================================================
// Type definitions
// ===========================================================

export type Trace = DestructionTrace | CreationTrace | CallTrace;

export type Traces = Record<`0x${string}`, Trace[]>;