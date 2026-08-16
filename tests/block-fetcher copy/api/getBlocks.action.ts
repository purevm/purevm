import type { HttpClient } from '../../../src/index.js';
import type { BlockNumber } from '../../../src/types.js';
import { bigintToHex } from '../../../src/utils.js';

import { processResponse } from './getBlocks.response.js';
import type { BlocksByBlockNumber, BlockByNumber, TransactionsByIndex, TransactionsByBlockNumber } from './getBlocks.types.js';

// ===========================================================
// Function definition
// ===========================================================

export async function getBlocksByNumber(
    client: HttpClient,
    fromBlock: bigint,
    toBlock: bigint,
    batchSize: number,
    maxRetries: number = 3,
): Promise<{ blocksByBlockNumber: BlocksByBlockNumber, transactionsByBlockNumber: TransactionsByBlockNumber }> {
    if (batchSize <= 0 || !Number.isSafeInteger(batchSize)) {
        throw new Error(`Invalid batchSize: ${batchSize}`);
    }

    const queue: bigint[] = [];

    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
        queue.push(blockNumber);
    }

    const retries = new Map<bigint, number>();
    const blocksByBlockNumber: BlocksByBlockNumber = {};
    const transactionsByBlockNumber: TransactionsByBlockNumber = {};

    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const blockNumber = queue.shift();

            if (blockNumber === undefined) {
                return;
            }

            try {
                const block = await getBlockByNumber(
                    client,
                    bigintToHex(blockNumber) as BlockNumber,
                );

                blocksByBlockNumber[blockNumber.toString() as `${bigint}`] = block.block;
                transactionsByBlockNumber[blockNumber.toString() as `${bigint}`] = block.transactions;
            } catch (error) {
                const retryCount = retries.get(blockNumber) ?? 0;

                if (retryCount >= maxRetries) {
                    throw new Error(
                        `Failed to fetch block ${blockNumber} after ${maxRetries} retries`,
                        { cause: error },
                    );
                }

                retries.set(blockNumber, retryCount + 1);
                queue.push(blockNumber);
            }
        }
    }

    const workers = Array.from(
        { length: Math.min(batchSize, queue.length) },
        () => worker(),
    );

    await Promise.all(workers);

    return {
        blocksByBlockNumber,
        transactionsByBlockNumber,
    };
}

export async function getBlockByNumber(client: HttpClient, blockNumber: BlockNumber): Promise<BlockByNumber> {
    const response = await client.eth.getBlockByNumber([
        blockNumber,
        true,
    ]);
    if (!response) {
        throw new Error(
            `Failed to fetch block by number: blockNumber=${blockNumber}`
        );
    }
    return processResponse(response);
}
