import type { HttpClient } from '../../../src/index.js';
import { getBlocksByNumber } from '../api/index.js';

// ===========================================================
// Main
// ===========================================================

export async function fetchBlocks(client: HttpClient, fromBlock: bigint, toBlock: bigint) {
    const {
        blocksByBlockNumber,
        transactionsByBlockNumber,
    } = await getBlocksByNumber(client, fromBlock, toBlock, 5);

    for (let i = fromBlock; i <= toBlock; i++) {
        const blockNumber = i.toString() as `${bigint}`;

        if (blocksByBlockNumber[blockNumber] === undefined) {
            throw new Error(`Block ${i} not found`);
        }
        if (transactionsByBlockNumber[blockNumber] === undefined) {
            throw new Error(`Transactions for block ${i} not found`);
        }
    }

    return {
        blocks: blocksByBlockNumber,
        transactions: transactionsByBlockNumber,
    };
}
