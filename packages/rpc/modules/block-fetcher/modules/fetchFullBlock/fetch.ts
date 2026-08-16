import type { HttpClient } from '../../../../src/index.js';
import { fetchBlocks, type BlocksByBlockNumber, type TransactionsByBlockNumber } from '../../extensions/index.js';
import { fetchBlocksTraces, type BlocksTraces } from '../../extensions/index.js';
import { fetchBlocksLogs, type BlocksLogs } from '../../extensions/index.js';
import type { FullBlock } from './call.js';

// ===========================================================
// Functions
// ===========================================================

export async function fetchMissingBlockData(
    client: HttpClient,
    fromBlock: bigint,
    toBlock: bigint,
    state: Partial<FullBlock>,
): Promise<unknown[]> {
    const tasks: Promise<void>[] = [];

    if (!state.blocks || !state.transactions) {
        tasks.push(
            fetchBlocks(client, fromBlock, toBlock).then(({ blocks, transactions }) => {
                state.blocks = blocks;
                state.transactions = transactions;
            }),
        );
    }

    if (!state.logs) {
        tasks.push(
            fetchBlocksLogs(client, fromBlock, toBlock).then(logs => {
                state.logs = logs;
            }),
        );
    }

    if (!state.traces) {
        tasks.push(
            fetchBlocksTraces(client, fromBlock, toBlock).then(traces => {
                state.traces = traces;
            }),
        );
    }

    const outcomes = await Promise.allSettled(tasks);

    return outcomes
        .filter((outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected')
        .map(outcome => outcome.reason);
}
