import type { HttpClient } from '../../../src/index.js';
import { bigintToHex } from '../../../src/utils.js';

import type { BlockLogs, TransactionLogs, Log } from '../api/index.js';
import { getBlocksLogsByRange } from '../api/index.js';
import { fetchBySplit } from './calls.js';

// ===========================================================
// Main
// ===========================================================

export async function fetchBlocksLogs(client: HttpClient, fromBlock: bigint, toBlock: bigint) {
    const results: { [blockNumber: string]: BlockLogs } = {};

    await fetchBySplit(
        async (batch: { fromBlock: `0x${string}`; toBlock: `0x${string}` }) => {
            const chunk = await getBlocksLogsByRange(client, batch.fromBlock, batch.toBlock);

            for (const [blockNumber, blockData] of Object.entries(chunk) as [ `0x${string}`, BlockLogs ][]) {
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
                // for (const [transactionHash, transactionLogs] of Object.entries(blockData.transactions) as [ `0x${string}`, TransactionLogs ][]) {  
                //     if (results[blockNumber]!.transactions[transactionHash] === undefined) {
                //         results[blockNumber]!.transactions[transactionHash] = transactionLogs;
                //         continue;
                //     } else {
                //         const resultTransactionHash = results[blockNumber]!.transactions[transactionHash]!.transactionHash;
                //         const currentTransactionHash = transactionLogs.transactionHash;
                //         if (resultTransactionHash !== currentTransactionHash) {
                //             throw new Error(`Transaction hash mismatch for transaction ${transactionHash}: expected ${resultTransactionHash}, got ${currentTransactionHash}`);
                //         }
                //     }
                //     for (const [logIndex, log] of Object.entries(transactionLogs.logs) as [ `0x${string}`, Log ][]) {
                //         if (results[blockNumber]!.transactions[transactionHash]!.logs[logIndex] === undefined) {
                //             results[blockNumber]!.transactions[transactionHash]!.logs[logIndex] = log;
                //             continue;
                //         }
                //         throw new Error(`Log index ${logIndex} already exists for transaction ${transactionHash} in block ${blockNumber}`);
                //     }
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
