import type { HttpClient } from '../clients/index.js';
import type { TraceEntry } from '../api/trace_/types.js';
import type { CallTrace, CreationTrace, DestructionTrace, RewardTrace } from './_types.js';

import { formatTrace } from './utils/format.js';
import { getEffectiveError, getPathKey } from './utils/error.js';
import { getTraceTxHash } from './utils/hash.js';

// ===========================================================
// Types
// ===========================================================

export type ParityTrace = DestructionTrace | CreationTrace | CallTrace | RewardTrace;
export type ParityTraces = { [blockNumber: number]: { [txHash: `0x${string}`]: ParityTrace[] } };

type ErrorsByPath = Record<string, string>;

interface TransactionData {
    traces: TraceEntry[];
    errors: ErrorsByPath;
}

interface BlockData {
    blockNumber: number;
    blockHash: `0x${string}`;
    transactions: Map<`0x${string}`, TransactionData>;
}

// ===========================================================
// Function definition
// ===========================================================

export async function getBlocksTraces(client: HttpClient, fromBlock: `0x${string}`, toBlock: `0x${string}`) {
    const response = await client.traceFilter({ fromBlock, toBlock });
    const rawTracesByBlock = groupTracesByBlock(response);
    const tracesByBlock = toParityTraces(rawTracesByBlock);

    return {
        fromBlock: fromBlock,
        toBlock: toBlock,
        results: tracesByBlock,
    };
}

// ===========================================================
// Private Functions
// ===========================================================

/** Group raw traces by block and tx, validating block-hash consistency and collecting per-tx errors. */
function groupTracesByBlock(traces: TraceEntry[]): Map<number, BlockData> {
    const byBlock: Map<number, BlockData> = new Map();

    for (const trace of traces) {
        const { blockHash, blockNumber } = trace;

        if (blockHash === undefined || blockHash === null) {
            throw new Error('Trace missing blockHash');
        }
        if (blockNumber === undefined || blockNumber === null) {
            throw new Error('Trace missing blockNumber');
        }

        let blockData = byBlock.get(blockNumber);
        if (!blockData) {
            blockData = { blockNumber, blockHash, transactions: new Map() };
            byBlock.set(blockNumber, blockData);
        } else if (blockData.blockHash !== blockHash) {
            throw new Error(
                `Block hash mismatch for block ${blockNumber}: expected ${blockData.blockHash}, got ${blockHash}`
            );
        }

        const txHash = getTraceTxHash(trace);
        const txData = blockData.transactions.get(txHash) ?? {
            traces: [],
            errors: {},
        };

        txData.traces.push(trace);

        if (trace.error) {
            const path = getPathKey(trace.traceAddress);
            txData.errors[path] = trace.error;
        }

        blockData.transactions.set(txHash, txData);
    }

    return byBlock;
}

/** Flatten grouped raw traces into Parity traces keyed by tx hash. */
function toParityTraces(byBlock: Map<number, BlockData>): ParityTraces {
    const result: ParityTraces = {};

    for (const [blockNumber, blockData] of byBlock) {
        for (const [txHash, { traces, errors }] of blockData.transactions) {
            // Append rather than assign: reward traces across blocks share NULL_TX_HASH.
            const blockTraces = result[blockNumber] ??= {};
            const transactionTraces = (blockTraces[txHash] ??= []);

            for (const trace of traces) {
                const effectiveError = getEffectiveError(trace.traceAddress, errors);
                const parityTrace = formatTrace(trace, effectiveError);
                transactionTraces.push(parityTrace);
            }
        }
    }

    return result;
}