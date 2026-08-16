import type { BlockNumber, BlockTag, Address } from '@/types/shared.types.js';
import type { TraceEntry } from "./types/entries.types.js";

// ============================================================================
// Types
// ============================================================================

export type TraceFilter = {
  method: "trace_filter";
  params: [
    {
      fromBlock?: BlockTag | BlockNumber;      // The block tag or number from which to start tracing
      toBlock?: BlockTag | BlockNumber;        // The block tag or number to which to trace
      fromAddress?: Address[];                 // An array of addresses from which to trace
      toAddress?: Address[];                   // An array of addresses to which to trace
      after?: number;                          // The offset trace number to start tracing from
      count?: number;                          // The number of traces to return
    }
  ];
  result: TraceEntry[];
};
