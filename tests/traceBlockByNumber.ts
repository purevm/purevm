import type { Client } from '../client/index.js';
import type { DestructionTrace, CreationTrace, CallTrace, RewardTrace } from './types.js';
import type { TraceBlockResponse } from "../client/api/trace/types.js";

// ===========================================================
// Types
// ===========================================================

export type Trace = DestructionTrace | CreationTrace | CallTrace | RewardTrace;

export type TraceTraces = Record<`0x${string}`, Trace[]>

// ===========================================================
// Function definition
// ===========================================================

export async function traceBlockByNumber(client: Client, blockNumber: `0x${string}`): Promise<TraceTraces> {
    const traces = await client.trace.traceBlock(blockNumber);

    const rawTracesByTxHash: Record<`0x${string}`, TraceBlockResponse> = {};

    // Groupe traces by transaction hash
    for (const trace of traces) {
        if (trace.type === 'reward') {
            continue; // Filter out reward traces
        }
        const hash = trace.transactionHash.toLowerCase() as `0x${string}`;
        
        if (!rawTracesByTxHash[hash]) {
            rawTracesByTxHash[hash] = [];
        }
        rawTracesByTxHash[hash]!.push(trace);
    }

    const tracesByTxHash: TraceTraces = {};
    const pathKey = (path: number[]) => path.join('.');

    for (const txHash of Object.keys(rawTracesByTxHash) as `0x${string}`[]) {
        const txTraces = rawTracesByTxHash[txHash]!;
        tracesByTxHash[txHash] = [];

        const sortedTraces = [...txTraces].sort((a, b) => {
            const lengthDiff = a.traceAddress.length - b.traceAddress.length;
            if (lengthDiff !== 0) return lengthDiff;
            const max = Math.max(a.traceAddress.length, b.traceAddress.length);
            for (let i = 0; i < max; i++) {
                const av = a.traceAddress[i] ?? -1;
                const bv = b.traceAddress[i] ?? -1;
                if (av !== bv) return av - bv;
            }
            return 0;
        });

        const errorsByPath = new Map<string, string>();
        const inheritedErrorForPath = (path: number[]): string | undefined => {
            for (let i = path.length; i >= 0; i--) {
                const inherited = errorsByPath.get(pathKey(path.slice(0, i)));
                if (inherited) return inherited;
            }
            return undefined;
        };

        for (const trace of sortedTraces) {
            if (trace.type === 'reward') continue;

            const effectiveError = trace.error ?? inheritedErrorForPath(trace.traceAddress.slice(0, -1));
            if (effectiveError) {
                errorsByPath.set(pathKey(trace.traceAddress), effectiveError);
            }

            if (trace.type === 'create') {
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
            }
        }
    }

    return tracesByTxHash;
}

// ===========================================================
// DEBUG / TESTING
// ===========================================================

// let categories = new Map<string, Set<string>>();
// let actions = new Map<string, Set<string>>();
// let results = new Map<string, Set<string>>();

// export function categoriesPrinter() {

//     const categorizeTrace = (trace: any) => {
//         const traceKeys = Object.keys(trace ?? {});
//         const actionKeys = Object.keys(trace.action ?? {});
//         const resultKeys = Object.keys(trace.result ?? {});

//         // Categories
//         const cat = categories.get(trace.type) ?? new Set<string>();
//         for (const key of traceKeys) {
//             cat.add(key);
//         }
//         categories.set(trace.type, cat);

//         // Actions
//         const act = actions.get(trace.type) ?? new Set<string>();
//         for (const key of actionKeys) {
//             act.add(key);
//         }
//         actions.set(trace.type, act);

//         // Results
//         const res = results.get(trace.type) ?? new Set<string>();
//         for (const key of resultKeys) {
//             res.add(key);
//         }
//         results.set(trace.type, res);
//     }

//     return {
//         categorizeTrace,
//         getCategories: () => categories,
//         getActions: () => actions,
//         getResults: () => results,
//     };
// }