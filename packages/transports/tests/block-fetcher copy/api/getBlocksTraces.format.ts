import type { CallTrace, CreationTrace, RewardTrace, Trace } from './getBlocksTraces.types.js';
import type { TraceEntry } from '../../../src/api/types.js';

/**
 * Convert a raw parity trace to a common trace.
 * @param trace - The raw parity trace.
 * @param effectiveError - The effective error.
 * @returns The common trace.
 */
export function formatTrace(trace: TraceEntry, effectiveError: string | undefined): Trace {
    // switch on the trace type
    switch (trace.type) {
        case 'call':
            return {
                type: trace.action.callType?.toUpperCase() as CallTrace['type'],
                from: trace.action.from,
                to: trace.action.to,
                gas: trace.action.gas,
                value: trace.action.value,
                input: trace.action.input,
                output: trace.result?.output ?? null,
                gasUsed: trace.result?.gasUsed ?? null,
                path: trace.traceAddress,
                error: effectiveError ?? null,
            };
        case 'create':
            return {
                type: trace.action.creationMethod?.toUpperCase() as CreationTrace['type'],
                from: trace.action.from,
                to: trace.result?.address ?? null,
                value: trace.action.value,
                input: trace.action.init,
                output: trace.result?.code ?? null,
                gas: trace.action.gas,
                gasUsed: trace.result?.gasUsed ?? null,
                path: trace.traceAddress,
                error: effectiveError ?? null,
            };
        case 'suicide':
            return {
                type: 'SUICIDE',
                from: trace.action.address,
                to: trace.action.refundAddress,
                value: trace.action.balance,
                path: trace.traceAddress,
                error: effectiveError ?? null,
            };
        case 'reward':
            return {
                type: 'REWARD',
                rewardType: trace.action.rewardType?.toUpperCase() as RewardTrace['rewardType'],
                to: trace.action.author,
                value: trace.action.value,
                path: trace.traceAddress,
                error: effectiveError ?? null,
            };
    }
}