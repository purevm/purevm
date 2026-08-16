import type { HttpClient } from '../../../src/index.js';
import type { TracesByBlockNumber, TracesByBlock } from '../api/index.js';
import { getBlocksTracesByRange } from '../api/index.js';
import { fetchBySplit } from './calls.js';

// ===========================================================
// Main
// ===========================================================

export async function fetchBlocksTraces(client: HttpClient, fromBlock: bigint, toBlock: bigint) {
    const results: TracesByBlockNumber = {};

    await fetchBySplit(
        async (batch: { fromBlock: `0x${string}`; toBlock: `0x${string}` }) => {
            const chunk = await getBlocksTracesByRange(client, { 
                fromBlock: batch.fromBlock, 
                toBlock: batch.toBlock,
            });

            for (const [blockNumber, blockData] of Object.entries(chunk) as [ `${bigint}`, TracesByBlock ][]) {
                if (results[blockNumber] !== undefined) {
                    throw new Error(`Duplicate traces for block ${blockNumber}`);
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
