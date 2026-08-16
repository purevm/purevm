import type { BlockNumber, BlockTag, TransactionHash } from '@/types/shared.types.js';
import type { CallTracerConfig } from "./types/tracer.types.js";
import type { DebugCallFrame } from "./types/callTracer.types.js";

// ============================================================================
// Types
// ============================================================================

export type DebugTraceBlockByNumber = {
    method: "debug_traceBlockByNumber";
    params: [
        blockNumber: BlockNumber | BlockTag,
        config: CallTracerConfig,
    ];
    result: Array<{
        txHash: TransactionHash;
        result: DebugCallFrame;
    }>;
}
