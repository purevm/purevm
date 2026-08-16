import type { HttpClient } from '../../../src/index.js';
import type { BlockTraces, TransactionTraces, BlocksTraces } from '../api/index.js';
import { getBlocksTracesByRange } from '../api/index.js';
import { fetchBySplit } from './calls.js';

// ===========================================================
// Main
// ===========================================================

export async function fetchBlocksTraces(client: HttpClient, fromBlock: bigint, toBlock: bigint) {
    const results: { [blockNumber: string]: BlockTraces } = {};

    await fetchBySplit(
        async ({ fromBlock, toBlock }) => {
            const chunk = await getBlocksTracesByRange(client, fromBlock, toBlock);

            for (const [blockNumber, blockData] of Object.entries(chunk) as [ `0x${string}`, BlockTraces ][]) {
                if (results[blockNumber] === undefined) {
                    results[blockNumber] = blockData;
                    continue;
                } else {
                    const resultBlockHash = results[blockNumber]!.blockHash;
                    const currentBlockHash = blockData.blockHash;
                    if (resultBlockHash !== currentBlockHash) {
                        throw new Error(`Block hash mismatch for block ${blockNumber}: expected ${resultBlockHash}, got ${currentBlockHash}`);
                    }
                }
                throw new Error('Not implemented');
                // for (const [transactionIndex, transactionTraces] of Object.entries(blockData.transactions) as [ `${number}`, TransactionTraces ][]) {  
                //     if (results[blockNumber]!.transactions[transactionIndex] === undefined) {
                //         results[blockNumber]!.transactions[transactionIndex] = transactionTraces;
                //         continue;
                //     } else {
                //         const resultTransactionHash = results[blockNumber]!.transactions[transactionIndex]!.transactionHash;
                //         const currentTransactionHash = transactionTraces.transactionHash;
                //         if (resultTransactionHash !== currentTransactionHash) {
                //             throw new Error(`Transaction hash mismatch for transaction ${transactionIndex}: expected ${resultTransactionHash}, got ${currentTransactionHash}`);
                //         }
                //     }
                //     // for (const [segment, trace] of Object.entries(transactionTraces.traces) as [ `${number}`, TransactionTrace ][]) {
                //     //     continue;
                //     // }
                // }
            }
        },
        {
            fromBlock,
            toBlock,
        },
    );

    for (let i = fromBlock; i <= toBlock; i++) {
        const blockNumber = i.toString() as `${bigint}`;

        if (results[blockNumber] === undefined) {
            throw new Error(`Block ${i} not found`);
        }
    }

    return results;
}
