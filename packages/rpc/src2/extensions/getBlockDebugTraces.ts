import type { Client } from '../client.js';
import type { DebugCallFrame, DebugTraceBlockByNumberEntry } from '../client/api/debug_/types.js';
import type { DestructionTrace, CreationTrace, CallTrace } from '../api/_types.js';

// ===========================================================
// Types
// ===========================================================

export type DebugTrace = DestructionTrace | CreationTrace | CallTrace;

export type DebugTraces = { [transactionHash: `0x${string}`]: DebugTrace[] };

// ===========================================================
// Function definition
// ===========================================================

export async function getBlockDebugTracesByNumber(client: Client, blockNumber: `0x${string}`): Promise<{ traces: DebugTraces }> {
    const traces = await client.debug.debugTraceBlockByNumber(blockNumber, { tracer: "callTracer" });
    return processResponse(traces);
}

export async function getBlockDebugTracesByHash(client: Client, blockHash: `0x${string}`): Promise<{ traces: DebugTraces }> {
    const traces = await client.debug.debugTraceBlockByHash(blockHash, { tracer: "callTracer" });
    return processResponse(traces);
}

// ===========================================================
// Function definition
// ===========================================================

function processResponse(traces: DebugTraceBlockByNumberEntry[]) {
    // ==========================
    // Recursively traverse the trace
    // ==========================

    const recurse = (hash: `0x${string}`, call: DebugCallFrame, path: number[], parentError?: string | undefined) => {
        const callError = call.error;
        const effectiveError = callError ?? parentError;

        const value = call.value ?? "0x0";
        const output = call.output ?? "0x";

        // Calls
        if (call.type === 'CALL' || call.type === 'CALLCODE' || call.type === 'STATICCALL' || call.type === 'DELEGATECALL') {
            tracesByTxHash[hash]!.push({
                from: call.from,
                to: call.to,
                value: value,
                input: call.input,
                output: output,
                type: call.type,
                path: path,
                error: effectiveError,
            });
        }
        // Creations
        if (call.type === 'CREATE' || call.type === 'CREATE2') {
            tracesByTxHash[hash]!.push({
                from: call.from,
                to: call.to,
                value: value,
                input: call.input,
                output: output,
                type: call.type,
                path: path,
                error: effectiveError,
            });
        }
        // Destructions
        if (call.type === 'SUICIDE' || call.type === 'SELFDESTRUCT') {
            tracesByTxHash[hash]!.push({
                from: call.from,
                to: call.to!,
                value: value,
                type: call.type,
                path: path,
                error: effectiveError,
            });
        }
        // Recursively traverse the calls
        if (call.calls && Array.isArray(call.calls)) {
            for (let j = 0; j < call.calls.length; j++) {
                recurse(hash, call.calls[j]!, [...path, j], effectiveError);
            }
        }
    };

    // ==========================
    // Process
    // ==========================

    let tracesByTxHash: DebugTraces = {};

    // Recursively traverse the trace
    for (const { txHash, result } of traces) {
        const hash = txHash.toLowerCase() as `0x${string}`;

        if (!tracesByTxHash[hash]) {
            tracesByTxHash[hash] = [];
        }
        recurse(hash, result, [], result.error);
    }

    return {
        traces: tracesByTxHash,
    };
}
