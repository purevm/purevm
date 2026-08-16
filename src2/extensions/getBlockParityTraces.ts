import type { Client } from '../client.js';
import type { DestructionTrace, CreationTrace, CallTrace, RewardTrace } from './_types.js';
import type { TraceBlockEntry } from "../client/api/trace_/types.js";

// ===========================================================
// Types
// ===========================================================

type ErrorsByPath = Map<string, string>;

type RawTracesByTxHash = Map<`0x${string}`, { traces: TraceBlockEntry[], errors: ErrorsByPath }>;

export type ParityTrace = DestructionTrace | CreationTrace | CallTrace | RewardTrace;

export type ParityTraces = Record<`0x${string}`, ParityTrace[]>

// ===========================================================
// Utils
// ===========================================================

const pathKey = (path: number[]): string => path.join('.');

const getEffectiveError = (
    path: number[],
    errors: ErrorsByPath,
): string | undefined => {
    for (let i = path.length; i >= 0; i--) {
        const error = errors.get(pathKey(path.slice(0, i)));
        if (error) return error;
    }
    return undefined;
};

// ===========================================================
// Function definition
// ===========================================================

export async function getBlockParityTracesByNumber(client: Client, blockNumber: `0x${string}`) {
    const response = await client.trace.traceBlockByNumber(blockNumber);
    const rawResponse = processRawTraces(response);
    const tracesByTxHash = processTraces(rawResponse.rawTracesByTxHash);

    return {
        blockHash: rawResponse.blockHash,
        tracesByTxHash: tracesByTxHash,
    };
}

export async function getBlockParityTracesByHash(client: Client, blockHash: `0x${string}`) {
    const traces = await client.trace.traceBlockByHash(blockHash);
    const rawResponse = processRawTraces(traces);
    const tracesByTxHash = processTraces(rawResponse.rawTracesByTxHash);

    return {
        blockHash: rawResponse.blockHash,
        tracesByTxHash: tracesByTxHash,
    };
}

// ===========================================================
// Private Functions
// ===========================================================

function processRawTraces(traces: TraceBlockEntry[]) {
    let blockHash = traces[0]?.blockHash;

    if (!blockHash) {
        throw new Error('Block hash not found for getBlockTraces');
    }

    const rawTracesByTxHash: RawTracesByTxHash = new Map();

    // Groupe raw traces by transaction hash
    for (const trace of traces) {
        if (trace.blockHash !== blockHash) {
            throw new Error('Block hash mismatch for getBlockTraces');
        }

        let transactionHash: `0x${string}`;
        if ('transactionHash' in trace) {
            transactionHash = trace.transactionHash.toLowerCase() as `0x${string}`;
        } else if (trace.type === 'reward') {
            transactionHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
        } else {
            throw new Error('Invalid trace');
        }

        let txData = rawTracesByTxHash.get(transactionHash);

        if (!txData) {
            txData = {
                traces: [],
                errors: new Map<string, string>(),
            };
            rawTracesByTxHash.set(transactionHash, txData);
        }
        txData.traces.push(trace);

        if (trace.error) {
            const path = pathKey(trace.traceAddress);
            txData.errors.set(path, trace.error);
        }
    }

    return {
        blockHash: blockHash,
        rawTracesByTxHash: rawTracesByTxHash,
    };
}

function processTraces(rawTracesByTxHash: RawTracesByTxHash) {
    const tracesByTxHash: ParityTraces = {};

    for (const [txHash, { traces, errors }] of rawTracesByTxHash.entries()) {
        tracesByTxHash[txHash] = [];

        for (const trace of traces) {
            const effectiveError = getEffectiveError(trace.traceAddress, errors);
            
            if (trace.type === 'create') {
                if (trace.action.creationMethod !== 'create2' && trace.action.creationMethod !== 'create') {
                    console.log(trace);
                }
                tracesByTxHash[txHash]!.push({
                    from: trace.action.from,
                    to: trace.result?.address,
                    value: trace.action.value,
                    input: trace.action.init,
                    output: trace.result?.code ?? "0x",
                    type: trace.action.creationMethod === 'create2' ? "CREATE2" : "CREATE",
                    path: trace.traceAddress,
                    error: effectiveError,
                });
            } else if (trace.type === 'suicide') {
                tracesByTxHash[txHash]!.push({
                    from: trace.action.address,
                    to: trace.action.refundAddress,
                    value: trace.action.balance,
                    type: "SUICIDE",
                    path: trace.traceAddress,
                    error: effectiveError,
                });
            } else if (trace.type === 'call') {
                if (trace.action.callType !== 'call' && trace.action.callType !== 'delegatecall' && trace.action.callType !== 'staticcall' && trace.action.callType !== 'callcode') {
                    console.log(trace);
                }
                tracesByTxHash[txHash]!.push({
                    from: trace.action.from,
                    to: trace.action.to,
                    value: trace.action.value,
                    input: trace.action.input,
                    output: trace.result?.output ?? "0x",
                    type: trace.action.callType.toUpperCase() as "CALL" | "CALLCODE" | "STATICCALL" | "DELEGATECALL",
                    path: trace.traceAddress,
                    error: effectiveError,
                });
            } else if (trace.type === 'reward') {
                tracesByTxHash[txHash]!.push({
                    type: "REWARD",
                    to: trace.action.author,
                    value: trace.action.value,
                    rewardType: trace.action.rewardType,
                    path: trace.traceAddress,
                    error: effectiveError,
                });
            } else {
                throw new Error(`Invalid trace type: ${(trace as any).type ?? 'unknown'}`);
            }
        }
    }

    return tracesByTxHash;
}