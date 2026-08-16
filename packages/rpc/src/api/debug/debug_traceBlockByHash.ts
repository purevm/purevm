import type { BlockHash, TransactionHash } from '@/types/shared.types.js';
import type { CallTracerConfig } from "./types/tracer.types.js";
import type { DebugCallFrame } from "./types/callTracer.types.js";

// ============================================================================
// Types
// ============================================================================

export type DebugTraceBlockByHash = {
    method: "debug_traceBlockByHash";
    params: [
        blockHash: BlockHash,
        config: CallTracerConfig,
    ];
    result: Array<{
        txHash: TransactionHash;
        result: DebugCallFrame;
    }>;
}
