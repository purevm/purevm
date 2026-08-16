import type { HttpClient } from '../../../src/index.js';
import type { BlockNumber } from '../../../src/types.js';
import { groupAndFormatTraces } from './getBlocksTraces.response.js';

/**
 * Fetch blocks traces by range.
 */
export async function getBlocksTracesByRange(client: HttpClient, fromBlock: BlockNumber, toBlock: BlockNumber) {
    const response = await client.trace.traceFilter([{ fromBlock, toBlock, }]);

    return groupAndFormatTraces(response);
}