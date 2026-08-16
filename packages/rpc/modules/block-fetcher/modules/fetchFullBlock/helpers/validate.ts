import type { Hash } from '../../../../../src/types.js';
import { hexToBigInt } from '../../../../../src/utils.js';
import type {
    LogsByBlock,
    TracesByBlock,
    Transaction,
    TransactionsByIndex,
} from '../../../api/index.js';
import type { FullBlock } from '../call.js';

// ===========================================================
// Main
// ===========================================================

export function validateBlocks(fromBlock: bigint, toBlock: bigint, state: Partial<FullBlock>): void {
    for (let current = fromBlock; current <= toBlock; current++) {
        validateBlock(current, state);
    }
}

// ===========================================================
// Validation
// ===========================================================

function validateBlock(expectedBlockNumber: bigint, state: Partial<FullBlock>): void {
    const blockNumber = expectedBlockNumber.toString() as `${bigint}`;
    const block = state.blocks?.[blockNumber];
    const transactions = state.transactions?.[blockNumber];
    const logs = state.logs?.[blockNumber];
    const traces = state.traces?.[blockNumber];

    if (!block) {
        throw new Error(`block ${blockNumber} not found`);
    }
    if (!transactions) {
        throw new Error(`transactions for block ${blockNumber} not found`);
    }
    if (!logs) {
        throw new Error(`logs for block ${blockNumber} not found`);
    }
    if (!traces) {
        throw new Error(`traces for block ${blockNumber} not found`);
    }
    if (hexToBigInt(block.number) !== expectedBlockNumber) {
        throw new Error(`unexpected block number: requested ${blockNumber}, got ${block.number}`);
    }

    validateBlockSource(blockNumber, block.hash, logs, 'logs');
    validateBlockSource(blockNumber, block.hash, traces, 'traces');
    validateCanonicalTransactions(blockNumber, block.hash, transactions);
    validateLogTransactions(blockNumber, transactions, logs);
    validateTraceTransactions(blockNumber, transactions, traces);
}

function validateBlockSource(
    blockNumber: `${bigint}`,
    expectedHash: Hash,
    source: LogsByBlock | TracesByBlock,
    sourceName: 'logs' | 'traces',
): void {
    if (source.blockNumber !== blockNumber) {
        throw new Error(`${sourceName} block number mismatch: expected ${blockNumber}, got ${source.blockNumber}`);
    }
    if (!sameHex(source.blockHash, expectedHash)) {
        throw new Error(`${sourceName} block hash mismatch for block ${blockNumber}`);
    }
}

function validateCanonicalTransactions(
    blockNumber: `${bigint}`,
    blockHash: Hash,
    transactions: TransactionsByIndex,
): void {
    for (const [transactionIndex, transaction] of transactionEntries(transactions)) {
        if (hexToBigInt(transaction.transactionIndex).toString() !== transactionIndex) {
            throw new Error(`transaction index mismatch for transaction ${transaction.hash}`);
        }
        if (hexToBigInt(transaction.blockNumber).toString() !== blockNumber) {
            throw new Error(`transaction ${transaction.hash} belongs to block ${transaction.blockNumber}`);
        }
        if (!sameHex(transaction.blockHash, blockHash)) {
            throw new Error(`transaction ${transaction.hash} has the wrong block hash`);
        }
    }
}

function validateLogTransactions(
    blockNumber: `${bigint}`,
    transactions: TransactionsByIndex,
    logs: BlockLogs,
): void {
    for (const [transactionIndex, logTransaction] of Object.entries(logs.transactions)) {
        const transaction = transactions[transactionIndex as `${bigint}`];

        validateAssociatedTransaction(
            blockNumber,
            transactionIndex,
            logTransaction.transactionIndex,
            logTransaction.transactionHash,
            transaction,
            'log',
        );
    }
}

function validateTraceTransactions(
    blockNumber: `${bigint}`,
    transactions: TransactionsByIndex,
    traces: BlockTraces,
): void {
    for (const [transactionIndex, traceTransaction] of Object.entries(traces.transactions)) {
        const transaction = transactions[transactionIndex as `${bigint}`];

        validateAssociatedTransaction(
            blockNumber,
            transactionIndex,
            traceTransaction.transactionIndex,
            traceTransaction.transactionHash,
            transaction,
            'trace',
        );
    }
}

function validateAssociatedTransaction(
    blockNumber: `${bigint}`,
    transactionIndex: string,
    storedIndex: string,
    transactionHash: Hash,
    transaction: Transaction | undefined,
    sourceName: 'log' | 'trace',
): void {
    if (!transaction) {
        throw new Error(`${sourceName} transaction ${transactionIndex} is not in block ${blockNumber}`);
    }
    if (storedIndex !== transactionIndex) {
        throw new Error(`${sourceName} transaction index mismatch: expected ${transactionIndex}, got ${storedIndex}`);
    }
    if (!sameHex(transactionHash, transaction.hash)) {
        throw new Error(`${sourceName} transaction ${transactionIndex} has the wrong hash`);
    }
}

function transactionEntries(
    transactions: TransactionsByIndex,
): [`${bigint}`, Transaction][] {
    return Object.entries(transactions) as [`${bigint}`, Transaction][];
}

function sameHex(left: string, right: string): boolean {
    return left.toLowerCase() === right.toLowerCase();
}
