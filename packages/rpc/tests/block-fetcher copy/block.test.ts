import { client } from '../_client.js';
import { getBlocksByRange, getBlockByNumber } from './api/index.js';
import { getBlocksTracesByRange } from './api/index.js';
import { bigintToHex } from '../../src/utils.js';

import type { BlockLogs, TransactionLogs, Log } from './api/getBlocksLogs.types.js';
import { getBlocksLogsByRange } from './api/index.js';

import { fetchBySplit } from './calls.js';

import { fetchBlocksLogs } from './extensions/fetchBlocksLogs.js';
import { fetchBlocksTraces } from './extensions/fetchBlocksTraces.js';  
import { fetchFullBlock } from './modules/index.js';

// ===========================================================
// Main
// ===========================================================

(async () => {
    const fromBlock = BigInt(107697893);
    const toBlock = fromBlock + BigInt(10);

    const results: { [blockNumber: string]: BlockLogs } = {};

    //await fetchBlocksLogs(client, fromBlock, toBlock, BigInt(10));
    //await fetchBlocksTraces(client, fromBlock, toBlock, BigInt(10));
    await fetchFullBlock(client, fromBlock, toBlock);
})();
