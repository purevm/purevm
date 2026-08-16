import type { HttpClient } from '../../../../src/index.js';
import { sleep } from './helpers/sleep.js';

import { validateBlocks } from './helpers/validate.js';
import { MAX_ATTEMPTS, RETRY_DELAY_MS } from './constants.js';
import { getMissingKeys } from './helpers/missing.js';
import { fetchMissingBlockData } from './fetch.js';
import { type BlocksByBlockNumber, type TransactionsByBlockNumber, type TracesByBlockNumber } from '../../api/index.js';
import { type LogsByBlockNumber } from '../../api/index.js';

// ===========================================================
// Types
// ===========================================================

export interface FullBlock {
    blocks: BlocksByBlockNumber;
    transactions: TransactionsByBlockNumber;
    logs: LogsByBlockNumber;
    traces: TracesByBlockNumber;
}

// ===========================================================
// Function definition
// ===========================================================

export async function fetchFullBlock(
    client: HttpClient, 
    fromBlock: bigint,
    toBlock: bigint,
    options?: {
        maxAttempts?: number;
        retryDelayMs?: number;
    }
): Promise<FullBlock> {
    const maxAttempts = options?.maxAttempts ?? MAX_ATTEMPTS;
    const retryDelayMs = options?.retryDelayMs ?? RETRY_DELAY_MS;

    if (fromBlock > toBlock) {
        throw new Error('fromBlock must be lower than or equal to toBlock');
    }
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
        throw new Error(`Invalid maxAttempts: ${maxAttempts}`);
    }
    if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
        throw new Error(`Invalid retryDelayMs: ${retryDelayMs}`);
    }

    let state: Partial<FullBlock> = {};
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) {
            console.warn(`retrying block ${fromBlock} to ${toBlock} (attempt ${attempt})`);
        }

        const fetchErrors = await fetchMissingBlockData(client, fromBlock, toBlock, state);
        const missing = getMissingKeys(state);

        if (fetchErrors.length > 0 || missing.length > 0) {
            lastError = new AggregateError(
                fetchErrors,
                `blocks range ${fromBlock} to ${toBlock}: failed to fetch ${missing.join(', ')}`,
            );
        } else {
            seedEmptyBlockData(fromBlock, toBlock, state as FullBlock);

            try {
                validateBlocks(fromBlock, toBlock, state);
                return state as FullBlock;
            } catch (error) {
                lastError = error;
                // A validation failure can indicate a reorg. Refetch every source
                // so data from different chain snapshots is never combined.
                state = {};
            }
        }

        if (attempt < maxAttempts) {
            await sleep(retryDelayMs * Math.pow(2, attempt - 1));
        }
    }

    throw new Error(`fetchFullBlock ${fromBlock} to ${toBlock} failed`, {
        cause: lastError,
    });
}

function seedEmptyBlockData(fromBlock: bigint, toBlock: bigint, state: FullBlock): void {
    for (let current = fromBlock; current <= toBlock; current++) {
        const blockNumber = current.toString() as `${bigint}`;
        const block = state.blocks[blockNumber];

        if (!block) {
            continue;
        }

        state.logs[blockNumber] ??= {
            blockHash: block.hash,
            blockNumber,
            transactions: {},
        };
        state.traces[blockNumber] ??= {
            blockHash: block.hash,
            blockNumber,
            transactions: {},
            rewards: [],
        };
    }
}
