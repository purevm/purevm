import type { RpcBlock, RpcTransaction } from '../../../src/types.js';
import type { BlockByNumber } from './getBlocks.types.js';
import { hexToBigInt } from '../../../src/utils.js';

// ===========================================================
// Function definition
// ===========================================================

export function processResponse(response: RpcBlock<true>): BlockByNumber {
    // Check if the transactions field is present
    if (!response.transactions) {
        throw new Error('Transactions field not found in block response');
    }
    
    // Split the result into block related data and transactions
    const { transactions, ...block } = response;

    // Sort all transactions by hash (lowercased)
    const transactionsByIndex: Record<`${bigint}`, RpcTransaction> = {};

    for (const tx of transactions) {
        const transactionIndex = hexToBigInt(tx.transactionIndex).toString() as `${bigint}`;
        transactionsByIndex[transactionIndex] = tx;
    }

    return {
        block: block,
        transactions: transactionsByIndex,
    };
}
