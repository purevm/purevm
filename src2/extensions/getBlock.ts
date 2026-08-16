import type { Client } from '../client.js';
import type { RpcTransaction, RpcBlock } from '../types/viem.types.js';
import type { BlockTag, BlockHash, BlockNumber } from '../types/shared.types.js';

// ===========================================================
// Types
// ===========================================================

export type Block = Omit<RpcBlock<BlockTag, true>, "transactions">;

export type Transaction = RpcTransaction<false>;

export type Transactions = { [transactionHash: `0x${string}`]: Transaction };

// ===========================================================
// Function definition
// ===========================================================

export async function getBlockByNumber(client: Client, blockNumber: BlockNumber) {
    const response = await client.eth.ethGetBlockByNumber<true>(blockNumber, true);
    return processResponse(response);
}

export async function getBlockByHash(client: Client, blockHash: BlockHash) {
    const response = await client.eth.ethGetBlockByHash<true>(blockHash, true);
    return processResponse(response);
}

// ===========================================================
// Private Functions
// ===========================================================

function processResponse(response: RpcBlock<BlockTag, true>) {
    // Check if the transactions field is present
    if (!response.transactions) {
        throw new Error('Transactions field not found for ethGetBlock');
    }
    
    // Split the result into block related data and transactions
    const { transactions, ...block } = response;

    // Sort all transactions by hash (lowercased)
    const transactionsByHash: Record<`0x${string}`, RpcTransaction<false>> = {};

    for (const tx of transactions) {
        const transactionHash = tx.hash.toLowerCase() as `0x${string}`;
        transactionsByHash[transactionHash] = tx;
    }

    return {
        block: block,
        transactions: transactionsByHash,
    };
}
