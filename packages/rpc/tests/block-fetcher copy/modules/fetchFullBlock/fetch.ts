import type { HttpClient } from '../../../../src/index.js';
import { fetchBlocks, type BlocksByBlockNumber, type TransactionsByBlockNumber } from '../../extensions/index.js';
import { fetchBlocksTraces, type BlocksTraces } from '../../extensions/index.js';
import { fetchBlocksLogs, type BlockLogs, type BlocksLogs } from '../../extensions/index.js';

// ===========================================================
// Private
// ===========================================================

export function fetchBlocksFactory(client: HttpClient) {
    const tasks: Map<string, Promise<void>> = new Map();

    const results: {
        blocks: BlocksByBlockNumber;
        transactions: TransactionsByBlockNumber;
        traces: BlocksTraces;
        logs: BlocksLogs;
    } = {
        blocks: {},
        transactions: {},
        traces: {},
        logs: {},
    };

    return async function(fromBlock: bigint, toBlock: bigint) {
        if (!tasks.has('fetchBlocks')) {
            tasks.set('fetchBlocks', 
                fetchBlocks(client, fromBlock, toBlock)
                    .then(({ blocks, transactions }) => {
                        results.blocks = blocks;
                        results.transactions = transactions;
                    })
                    .catch(err => {
                        console.error(`Failed to fetch blocks: ${err}`);
                    })
                    .finally(() => {
                        tasks.delete('fetchBlocks');
                    })
            );
        }
        if (!tasks.has('fetchBlocksLogs')) {
            tasks.set('fetchBlocksLogs', 
                fetchBlocksLogs(client, fromBlock, toBlock)
                    .then(res => {
                        results.logs = res;
                    })
                    .catch(err => {
                        console.error(`Failed to fetch blocks logs: ${err}`);
                    })
                    .finally(() => {
                        tasks.delete('fetchBlocksLogs');
                    })
            );
        }
        if (!tasks.has('fetchBlocksTraces')) {
            tasks.set('fetchBlocksTraces', 
                fetchBlocksTraces(client, fromBlock, toBlock)
                    .then(res => {
                        results.traces = res;
                    }) 
                    .catch(err => {
                        console.error(`Failed to fetch blocks traces: ${err}`);
                    })
                    .finally(() => {
                        tasks.delete('fetchBlocksTraces');
                    })
            );
        }
    
        const promises = Array.from(tasks.values());
        await Promise.allSettled(promises);
        return results;
    }
}