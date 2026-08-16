import type { TraceEntry } from '../../api/trace_/types.js';

// ===========================================================
// Constants
// ===========================================================

export function getTraceTxHash(trace: TraceEntry): `0x${string}` {
    if ('transactionHash' in trace && trace.transactionHash) {
        return trace.transactionHash.toLowerCase() as `0x${string}`;
    }
    if (trace.type === 'reward') {
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
    }
    throw new Error(`Trace without transactionHash: type=${trace.type}`);
};