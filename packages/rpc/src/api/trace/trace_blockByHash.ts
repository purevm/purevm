import type { BlockHash } from '@/types/shared.types.js';
import type { TraceEntry } from "./types/entries.types.js";

// ============================================================================
// Types
// ============================================================================

export type TraceBlockByHash = {
  method: "trace_block";
  params: [
    blockHash: BlockHash,
  ];
  result: TraceEntry[];
}
