import type { Hash, RpcLog } from '../../../src/types.js';

// ===========================================================
// Standardized Log Types
// ===========================================================

/**
 * A log emitted by a transaction.
 */
export type Log = {
    /** The address of the contract that emitted the log. */
    address: RpcLog['address'];
    /** The data of the log. */
    data: RpcLog['data'];
    /** The index of the log. */
    logIndex: RpcLog['logIndex'];
    /** Whether the log was removed. */
    removed: RpcLog['removed'];
    /** The topics of the log. */
    topics: RpcLog['topics'];
};

// ===========================================================
// Action types
// ===========================================================

/**
 * Logs data by transaction.
 */
export type LogsByTransaction = {
    /** Hash of the transaction that emitted this log. */
    transactionHash: Hash
    /** Index of the transaction that emitted this log, encoded as a hex quantity. */
    transactionIndex: `${bigint}`
    /** Logs emitted by the transaction. */
    logs: { 
        [logIndex: `${bigint}`]: Log 
    }
};

/**
 * Logs data by transaction index.
 */
export type LogsByTransactionIndex = {
    [transactionIndex: `${bigint}`]: LogsByTransaction
}

/**
 * Logs data by block.
 */
export type LogsByBlock = {
    /** Hash of the block. */
    blockHash: Hash
    /** Number of the block. */
    blockNumber: `${bigint}`
    /** Timestamp of the block. */
    blockTimestamp?: `${bigint}`
    /** Transactions emitted by the block. */
    transactions: LogsByTransactionIndex
};

/**
 * Block logs by block number.
 */
export type LogsByBlockNumber = {
    [blockNumber: `${bigint}`]: LogsByBlock
}