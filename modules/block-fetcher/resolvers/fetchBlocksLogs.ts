import type { HttpClient } from '../../../src/index.js';
import type { LogsByBlockNumber, LogsByBlock } from '../api/index.js';
import { getBlocksLogsByRange } from '../api/index.js';
import { fetchBySplit } from './calls.js';

// ===========================================================
// Main
// ===========================================================

export async function fetchBlocksLogs(client: HttpClient, fromBlock: bigint, toBlock: bigint) {
    const results: LogsByBlockNumber = {};

    await fetchBySplit(
        async (batch: { fromBlock: `0x${string}`; toBlock: `0x${string}` }) => {
            const chunk = await getBlocksLogsByRange(client, batch.fromBlock, batch.toBlock);

            for (const [blockNumber, blockData] of Object.entries(chunk) as [ `${bigint}`, LogsByBlock ][]) {
                if (results[blockNumber] !== undefined) {
                    throw new Error(`Duplicate logs for block ${blockNumber}`);
                }
                results[blockNumber] = blockData;
            }
        },
        {
            fromBlock,
            toBlock,
        },
    );

    return results;
}
