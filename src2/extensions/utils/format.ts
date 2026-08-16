import type { TraceEntry } from '../../api/trace_/types.js';
import type { CallTrace, CreationTrace, Trace } from '../_types.js';
import { CREATE_METHODS, CALL_TYPES } from '../constants.js';

// ===========================================================
// Utils
// ===========================================================

/** Convert a raw parity trace to a common trace. */
export function formatTrace(trace: TraceEntry, effectiveError: string | undefined): Trace {
    // switch on the trace type
    switch (trace.type) {
        case 'create':
            if (!trace.action.creationMethod || !CREATE_METHODS.has(trace.action.creationMethod)) {
                console.log(trace); // TODO: remove this
            }
            return {
                type: trace.action.creationMethod?.toUpperCase() as CreationTrace['type'],
                from: trace.action.from,
                to: trace.result?.address,
                value: trace.action.value,
                input: trace.action.init,
                output: trace.result?.code ?? '0x',
                path: trace.traceAddress,
                error: effectiveError,
            };
        case 'call':
            if (!trace.action.callType || !CALL_TYPES.has(trace.action.callType)) {
                console.log(trace); // TODO: remove this
            }
            return {
                type: trace.action.callType?.toUpperCase() as CallTrace['type'],
                from: trace.action.from,
                to: trace.action.to,
                value: trace.action.value,
                input: trace.action.input,
                output: trace.result?.output ?? '0x',
                path: trace.traceAddress,
                error: effectiveError,
            };
        case 'suicide':
            return {
                type: 'SUICIDE',
                from: trace.action.address,
                to: trace.action.refundAddress,
                value: trace.action.balance,
                path: trace.traceAddress,
                error: effectiveError,
            };
        case 'reward':
            return {
                type: 'REWARD',
                to: trace.action.author,
                value: trace.action.value,
                rewardType: trace.action.rewardType,
                path: trace.traceAddress,
                error: effectiveError,
            };
    }
}