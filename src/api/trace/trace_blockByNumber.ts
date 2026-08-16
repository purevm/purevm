import type { BlockNumber, BlockTag } from '@/types/shared.types.js';
import type { TraceEntry } from "./types/entries.types.js";

// ============================================================================
// Types
// ============================================================================

export type TraceBlockByNumber = {
  method: "trace_block";
  params: [
    blockNumber: BlockNumber | BlockTag,
  ];
  result: TraceEntry[];
}
