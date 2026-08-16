import type { HttpClient } from '../../../../src/index.js';
// import type { Block, Transactions, Receipts, DebugTraces, ParityTraces } from '../../api/_index.js';
import { sleep } from './helpers/sleep.js';

import { validateBlocks } from './helpers/validate.js';
import { MAX_ATTEMPTS, RETRY_DELAY_MS, RETRY_JITTER_MS } from './constants.js';
import { getMissingKeys } from './helpers/missing.js';
import { fetchBlocksFactory } from './fetch.js';
import { type BlocksByBlockNumber, type TransactionsByBlockNumber, type BlocksTraces } from '../../api/index.js';
import { type BlocksLogs } from '../../api/index.js';

// ===========================================================
// Types
// ===========================================================

export interface FullBlock {
    logs?: BlocksLogs;
    traces?: BlocksTraces;
}

export type PartialBlocks = {
    blocks?: BlocksByBlockNumber;
    transactions?: TransactionsByBlockNumber;
    logs?: BlocksLogs;
    traces?: BlocksTraces;
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
    // Transform the block number to hex if it is a bigint
    const fetchBlocksByRange = fetchBlocksFactory(client);

    // Default options
    const maxAttempts = options?.maxAttempts ?? MAX_ATTEMPTS;
    const retryDelayMs = options?.retryDelayMs ?? RETRY_DELAY_MS;

    // Try to fetch the block data
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) {
            console.warn(`retrying block ${fromBlock} to ${toBlock} (attempt ${attempt})`);
        }

        // Fetch the block data (only missing data)
        const results = await fetchBlocksByRange(fromBlock, toBlock);
        
        const missing = getMissingKeys(results);
        if (missing.length > 0) {
            throw new Error(`blocks range ${fromBlock} to ${toBlock}: failed to fetch ${missing.join(', ')}`);
        }

        try {
            validateBlocks(fromBlock, toBlock, results);
            return results as FullBlock;
        } catch (err) {
            if (attempt === maxAttempts) {
                throw err;
            }
            await sleep(retryDelayMs * Math.pow(2, attempt - 1));
        }
    }

    throw new Error(`fetchFullBlock ${fromBlock} to ${toBlock}: unreachable`);
}
