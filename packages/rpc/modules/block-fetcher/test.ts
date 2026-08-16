import { client } from '../client.js';
import { fetchFullBlock } from './modules/index.js';
// import { fetchBlocks } from './extensions/index.js';
// import { fetchBlocksTraces } from './extensions/index.js';
// import { fetchBlocksLogs } from './extensions/index.js';

// ===========================================================
// Main
// ===========================================================

(async () => {
    const fromBlock = BigInt(13027315);
    const toBlock = fromBlock + BigInt(10);

    // await fetchBlocks(client, fromBlock, toBlock);
    // await fetchBlocksLogs(client, fromBlock, toBlock);
    // await fetchBlocksTraces(client, fromBlock, toBlock);
    await fetchFullBlock(client, fromBlock, toBlock);
})();
