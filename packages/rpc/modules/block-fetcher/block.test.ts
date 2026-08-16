import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { HttpClient } from '../../src/index.js';
import type { RpcBlock, RpcLog, TraceEntry } from '../../src/types.js';
import { getBlocksTracesByRange } from './api/getBlocksTraces.action.js';
import { groupAndFormatTraces } from './api/getBlocksTraces.response.js';
import { fetchFullBlock, type FullBlock } from './modules/index.js';
import { validateBlocks } from './modules/fetchFullBlock/helpers/validate.js';

test('fetches a range once and represents blocks with no logs or traces', async () => {
    const calls = {
        blocks: 0,
        logs: 0,
        traces: 0,
    };
    const client = createClient({
        getBlock(blockNumber) {
            calls.blocks++;
            return makeEmptyBlock(blockNumber);
        },
        getLogs() {
            calls.logs++;
            return [];
        },
        getTraces() {
            calls.traces++;
            return [];
        },
    });

    const result = await fetchFullBlock(client, 10n, 12n, {
        retryDelayMs: 0,
    });

    assert.equal(calls.blocks, 3);
    assert.equal(calls.logs, 1);
    assert.equal(calls.traces, 1);

    for (const blockNumber of ['10', '11', '12'] as const) {
        assert.deepEqual(result.transactions[blockNumber], {});
        assert.deepEqual(result.logs[blockNumber]?.transactions, {});
        assert.deepEqual(result.traces[blockNumber]?.transactions, {});
    }
});

test('retries only the failed data category', async () => {
    const calls = {
        blocks: 0,
        logs: 0,
        traces: 0,
    };
    const client = createClient({
        getBlock(blockNumber) {
            calls.blocks++;
            return makeEmptyBlock(blockNumber);
        },
        getLogs() {
            calls.logs++;
            if (calls.logs <= 2) {
                throw new Error('temporary log failure');
            }
            return [];
        },
        getTraces() {
            calls.traces++;
            return [];
        },
    });

    await fetchFullBlock(client, 20n, 20n, {
        maxAttempts: 2,
        retryDelayMs: 0,
    });

    assert.equal(calls.blocks, 1);
    assert.equal(calls.logs, 3);
    assert.equal(calls.traces, 1);
});

test('preserves the transaction root when building a trace tree', () => {
    const traces = groupAndFormatTraces([
        makeCallTrace([]),
        makeCallTrace([0]),
    ]);

    const root = traces['30']?.transactions['0']?.traces[0];

    assert.deepEqual(root?.path, []);
    assert.deepEqual(root?.subTraces?.[0]?.path, [0]);
});

test('paginates trace_filter responses', async () => {
    const requestedOffsets: number[] = [];
    const firstPage = Array.from(
        { length: 1_000 },
        (_, index) => makeRewardTrace(index),
    );
    const client = {
        trace: {
            async traceFilter([filter]: [{ after?: number }]) {
                requestedOffsets.push(filter.after ?? 0);
                return filter.after === 0 ? firstPage : [];
            },
        },
    } as unknown as HttpClient;

    const traces = await getBlocksTracesByRange(client, '0x32', '0x32');

    assert.deepEqual(requestedOffsets, [0, 1_000]);
    assert.equal(traces['50']?.rewards.length, 1_000);
});

test('rejects a log associated with a transaction absent from the block', () => {
    const block = makeEmptyBlock(40n);
    const { transactions, ...blockHeader } = block;
    const state = {
        blocks: { '40': blockHeader },
        transactions: { '40': {} },
        logs: {
            '40': {
                blockHash: block.hash,
                blockNumber: '40',
                transactions: {
                    '0': {
                        transactionHash: '0xtransaction',
                        transactionIndex: '0',
                        logs: {},
                    },
                },
            },
        },
        traces: {
            '40': {
                blockHash: block.hash,
                blockNumber: '40',
                transactions: {},
                rewards: [],
            },
        },
    } as unknown as FullBlock;

    assert.throws(
        () => validateBlocks(40n, 40n, state),
        /is not in block 40/,
    );
});

type ClientBehavior = {
    getBlock(blockNumber: bigint): RpcBlock<true>;
    getLogs(): RpcLog[];
    getTraces(): TraceEntry[];
};

function createClient(behavior: ClientBehavior): HttpClient {
    return {
        eth: {
            async getBlockByNumber(params: [`0x${string}`, true]) {
                return behavior.getBlock(BigInt(params[0]));
            },
            async getLogsByRange() {
                return behavior.getLogs();
            },
        },
        trace: {
            async traceFilter() {
                return behavior.getTraces();
            },
        },
    } as unknown as HttpClient;
}

function makeEmptyBlock(blockNumber: bigint): RpcBlock<true> {
    return {
        hash: `0xblock${blockNumber}`,
        number: `0x${blockNumber.toString(16)}`,
        transactions: [],
    } as unknown as RpcBlock<true>;
}

function makeCallTrace(path: number[]): TraceEntry {
    return {
        action: {
            callType: 'call',
            from: '0xfrom',
            to: '0xto',
            gas: '0x1',
            input: '0x',
            value: '0x0',
        },
        blockHash: '0xblock30',
        blockNumber: 30,
        result: {
            gasUsed: '0x1',
            output: '0x',
        },
        subtraces: path.length === 0 ? 1 : 0,
        traceAddress: path,
        transactionHash: '0xtransaction',
        transactionPosition: 0,
        type: 'call',
    };
}

function makeRewardTrace(index: number): TraceEntry {
    return {
        action: {
            author: '0xauthor',
            rewardType: 'block',
            value: `0x${index.toString(16)}`,
        },
        blockHash: '0xblock50',
        blockNumber: 50,
        result: null,
        subtraces: 0,
        traceAddress: [],
        type: 'reward',
    };
}
