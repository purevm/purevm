import type { HttpClient } from '../../../src/index.js';
import type { BlockNumber } from '../../../src/types.js';
import { groupAndFormatLogs } from './getBlocksLogs.response.js';

/**
 * Fetch block logs by range.
 * @param client - The HTTP client.
 * @param fromBlock - The start block number.
 * @param toBlock - The end block number.
 * @returns The sorted logs by block number and transaction hash.
 */
export async function getBlocksLogsByRange(client: HttpClient, fromBlock: BlockNumber, toBlock: BlockNumber) {
    const response = await client.eth.getLogsByRange([{ fromBlock, toBlock }]);
    
    if (!response) {
        throw new Error(
            `Failed to fetch block logs by range: fromBlock=${fromBlock}, toBlock=${toBlock}`  
        );
    }

    return groupAndFormatLogs(response);
}
