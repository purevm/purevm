import type { TraceEntry } from '../../../src/types.js';
import type { TransactionTrace, Trace, RewardTrace } from './getBlocksTraces.types.js';
import { formatTrace } from './getBlocksTraces.format.js';

// ===========================================================
// Functions
// ===========================================================

/**
 * Extracts the transaction index associated with a trace entry.
 */
export function getTraceTransactionIndex(trace: TraceEntry): `${number}` {
    if ('transactionPosition' in trace) {
        return String(trace.transactionPosition) as `${number}`;
    }

    return '-1';
}

/**
 * Extracts the transaction hash associated with a trace entry.
 *
 * For most traces, this returns the transaction hash to which the trace belongs,
 * normalized to lowercase.
 *
 * For reward traces, which are not attached to a real transaction, a synthetic
 * zero-hash is returned instead.
 */
export function getTraceTransactionHash(trace: TraceEntry): `0x${string}` {
    if ('transactionHash' in trace && trace.transactionHash) {
        return trace.transactionHash.toLowerCase() as `0x${string}`;
    }

    if (trace.type === 'reward') {
        return `0x${'0'.repeat(64)}` as `0x${string}`;
    }

    throw new Error(`Trace without transactionHash: type=${trace.type}`);
}

/**
 * Compares two `traceAddress` arrays as they would appear in a pre-order
 * parent-before-children depth-first traversal of the call tree.
 *
 * Example:
 * [] < [0] < [0, 0] < [0, 1] < [1]
 */
export function traceAddressCompare(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return a[i]! - b[i]!;
        }
    }

    return a.length - b.length;
}

/**
 * Returns true if `ancestor` is a strict prefix of `addr`.
 */
export function isAncestor(ancestor: number[], addr: number[]): boolean {
    if (ancestor.length >= addr.length) {
        return false;
    }

    for (let i = 0; i < ancestor.length; i++) {
        if (ancestor[i] !== addr[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Returns true if the trace is attached to a transaction.
 */
export function isTransactionTrace(trace: Trace): trace is TransactionTrace {
    return trace.type !== 'REWARD';
}

/**
 * Returns true if the trace is a reward trace.
 */
export function isRewardTrace(trace: Trace): trace is RewardTrace {
    return trace.type === 'REWARD';
}

/**
 * Inserts a transaction trace into a nested call tree using its path.
 *
 * path []        => calls.push(trace)
 * path [0]       => calls[0] = trace
 * path [0, 4]    => calls[0].calls[4] = trace
 * path [0, 4, 2] => calls[0].calls[4].calls[2] = trace
 */
export function insertTransactionTrace(
    calls: TransactionTrace[],
    trace: TransactionTrace,
): void {
    const { path } = trace;

    if (path.length === 0) {
        calls.push(trace);
        return;
    }

    let currentCalls = calls;

    for (let i = 0; i < path.length; i++) {
        const index = path[i]!;
        const isLast = i === path.length - 1;

        if (isLast) {
            currentCalls[index] = trace;
            return;
        }

        const parent = currentCalls[index];

        if (!parent) {
            throw new Error(
                `Missing parent trace for path ${path.join('.')}`,
            );
        }

        parent.subTraces ??= [];
        currentCalls = parent.subTraces;
    }
}

/**
 * Formats a transaction's traces and propagates errors from a failing call
 * to all of its subcalls.
 *
 * Requires `sortedTraces` to already be in pre-order.
 */
export function applyEffectiveErrors(sortedTraces: TraceEntry[]): Trace[] {
    const stack: { traceAddress: number[]; error?: string }[] = [];
    const out: Trace[] = [];

    for (const trace of sortedTraces) {
        const currentAddr = trace.traceAddress;

        while (
            stack.length > 0
            && !isAncestor(stack[stack.length - 1]!.traceAddress, currentAddr)
        ) {
            stack.pop();
        }

        const inheritedError = stack[stack.length - 1]?.error;
        const effectiveError = trace.error ?? inheritedError;

        stack.push({
            traceAddress: currentAddr,
            error: effectiveError,
        });

        out.push(formatTrace(trace, effectiveError));
    }

    return out;
}

/**
 * Formats traces and builds a nested transaction call tree.
 *
 * Reward traces are ignored because they are block-level traces, not
 * transaction call frames.
 */
export function buildTransactionTraceTree(sortedTraces: TraceEntry[]): TransactionTrace[] {
    const formattedTraces = applyEffectiveErrors(sortedTraces);
    const calls: TransactionTrace[] = [];

    for (const trace of formattedTraces) {
        if (!isTransactionTrace(trace)) {
            continue;
        }

        insertTransactionTrace(calls, trace);
    }

    return calls;
}