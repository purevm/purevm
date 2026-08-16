import type { RpcBlock, RpcTransaction } from '../../../src/types.js';

// ===========================================================
// Types
// ===========================================================

export type Block = Omit<RpcBlock, "transactions">;

export type Transaction = RpcTransaction;

export type TransactionsByIndex = {
    [transactionIndex: `${bigint}`]: Transaction
};

export type BlockByNumber = {
    block: Block;
    transactions: {
        [transactionIndex: `${bigint}`]: Transaction
    };
};

export type BlocksByBlockNumber = {
    [blockNumber: `${bigint}`]: Block;
};

export type TransactionsByBlockNumber = {
    [blockNumber: `${bigint}`]: TransactionsByIndex;
};