import type { TraceEntry, Hex } from '../../../src/types.js';
import type { BlockTraces, BlocksTraces } from './getBlocksTraces.types.js';
import { traceAddressCompare, buildTransactionTraceTree, isRewardTrace, applyEffectiveErrors } from './getBlocksTraces.utils.js';
import { getTraceTransactionIndex, getTraceTransactionHash } from './getBlocksTraces.utils.js';
import { hexToBigInt } from '../../../src/utils.js';

/**
 * Groups raw traces by block and transaction, sorts each transaction's
 * traces into pre-order, formats them with inherited effective errors,
 * then builds a nested transaction trace tree.
 *
 * Throws if two traces claim the same block number but disagree on block hash.
 */
export function groupAndFormatTraces(traces: TraceEntry[]): BlocksTraces {
    const byBlock = new Map<
        `${bigint}`,
        {
            blockHash: Hex;
            byTx: Map<`0x${string}`, TraceEntry[]>;
            rewards: TraceEntry[];
        }
    >();

    for (const trace of traces) {
        const { blockHash } = trace;
        const blockNumber = String(trace.blockNumber) as `${bigint}`;

        let block = byBlock.get(blockNumber);

        if (!block) {
            block = {
                blockHash,
                byTx: new Map(),
                rewards: [],
            };

            byBlock.set(blockNumber, block);
        } else if (block.blockHash !== blockHash) {
            throw new Error(
                `Block hash mismatch for block ${blockNumber}: expected ${block.blockHash}, got ${blockHash}`,
            );
        }

        if (trace.type === 'reward') {
            block.rewards.push(trace);
            continue;
        }

        const txHash = getTraceTransactionHash(trace);
        const txTraces = block.byTx.get(txHash) ?? [];

        txTraces.push(trace);
        block.byTx.set(txHash, txTraces);
    }

    const result: BlocksTraces = {};

    for (const [blockNumber, block] of byBlock) {
        const blockOut: BlockTraces = {
            blockHash: block.blockHash,
            blockNumber,
            transactions: {},
            rewards: [],
        };

        const formattedRewards = applyEffectiveErrors(block.rewards);

        for (const trace of formattedRewards) {
            if (isRewardTrace(trace)) {
                blockOut.rewards.push(trace);
            }
        }

        for (const [txHash, txTraces] of block.byTx) {
            txTraces.sort((a, b) => (
                traceAddressCompare(a.traceAddress, b.traceAddress)
            ));

            const transactionIndex = getTraceTransactionIndex(txTraces[0]!).toString() as `${bigint}`;
            const traces = buildTransactionTraceTree(txTraces);

            blockOut.transactions[transactionIndex] = {
                transactionHash: txHash,
                transactionIndex: transactionIndex,
                traces: traces,
            };
        }

        result[blockNumber] = blockOut;
    }

    return result;
}