import type { HttpClient } from '../../../src/index.js';
import type { BlockNumber, TraceEntry } from '../../../src/types.js';
import type { TracesByBlockNumber } from './getBlocksTraces.types.js';
import { groupAndFormatTraces } from './getBlocksTraces.response.js';

/**
 * Parameters for the getBlocksTracesByRange function.
 */
type BlocksTracesByRangeParams = {
    fromBlock: BlockNumber,
    toBlock: BlockNumber,
    pageSize?: number,
};

/**
 * Fetch blocks traces by range.
 */
export async function getBlocksTracesByRange(client: HttpClient, params: BlocksTracesByRangeParams): Promise<TracesByBlockNumber> {
    const { fromBlock, toBlock, pageSize = 10_000 } = params;

    const traces: TraceEntry[] = [];

    for (let after = 0; ; after += pageSize) {
        const page = await client.trace.traceFilter([{
            fromBlock,
            toBlock,
            after,
            count: pageSize,
        }]);

        traces.push(...page);
        console.log(`fetched ${page.length} traces from block ${fromBlock} to block ${toBlock}`);

        if (page.length < pageSize) {
            return groupAndFormatTraces(traces);
        }
    }
}
