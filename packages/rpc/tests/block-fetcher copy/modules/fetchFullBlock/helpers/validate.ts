import type { PartialBlocks } from '../call.js';
import type { Transaction } from '../../../api/index.js';

/**
 * Validates the block data
 * @param state - The state
 * @returns void
 */
export function validateBlocks(fromBlock: bigint, toBlock: bigint, state: PartialBlocks): void {
    for (let i = fromBlock; i <= toBlock; i++) {
        const blockNumber = i.toString() as `${bigint}`;

        const block = state.blocks?.[blockNumber];
        const transactions = state.transactions?.[blockNumber];
        const logs = state.logs?.[blockNumber];
        const traces = state.traces?.[blockNumber];
    
        // Block exist everywhere

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
    
        const blockHash = block.hash;
        const logBlockHash = logs.blockHash;
        const traceBlockHash = traces.blockHash;
    
        // Block hash is the same in all sources

        if (blockHash !== logBlockHash) {
            throw new Error(`block hash mismatch for block ${blockNumber}: expected ${blockHash}, got ${logBlockHash}`);
        }
        if (blockHash !== traceBlockHash) {
            throw new Error(`block hash mismatch for block ${blockNumber}: expected ${blockHash}, got ${traceBlockHash}`);
        }

        // Transactions exist everywhere

        for (const [transactionIndex, transaction] of Object.entries(transactions) as [ `${bigint}`, Transaction ][]) {
            const logTransaction = logs.transactions?.[transactionIndex];
            const traceTransaction = traces.transactions?.[transactionIndex];

            if (logTransaction && logTransaction.transactionHash !== transaction.hash) {
                throw new Error(`transaction ${transactionIndex}: expected ${transaction.hash}, got ${logTransaction.transactionHash}`);
            }
            if (traceTransaction && traceTransaction.transactionHash !== transaction.hash) {
                throw new Error(`transaction ${transactionIndex}: expected ${transaction.hash}, got ${traceTransaction.transactionHash}`);
            }
        }

        console.log(`block ${blockNumber} validated`);
    }

    console.log('all blocks validated');
}

export function blockIsValid(blockNumber: `${bigint}`, state: PartialBlocks): void {
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

    const blockHash = block.hash;
    const logBlockHash = logs.blockHash;
    const traceBlockHash = traces.blockHash;

    if (blockHash !== logBlockHash) {
        throw new Error(`block hash mismatch for block ${blockNumber}: expected ${blockHash}, got ${logBlockHash}`);
    }
    if (blockHash !== traceBlockHash) {
        throw new Error(`block hash mismatch for block ${blockNumber}: expected ${blockHash}, got ${traceBlockHash}`);
    }
}

export function validateTransactions(state: PartialBlocks, blocks: `${bigint}`[]): void {
    // Ensure all blocks have transactions and traces
    for (const blockNumber of blocks) {
        const blockLogs = state.logs?.[blockNumber];
        const blockTraces = state.traces?.[blockNumber];

        const logTransactions = Object.keys(blockLogs?.transactions ?? {}) as `${bigint}`[];
        const traceTransactions = Object.keys(blockTraces?.transactions ?? {}) as `${bigint}`[];
    
        // Transaction can don't have logs
        // if (logTransactions.length !== traceTransactions.length) {
        //     throw new Error(`log transactions and trace transactions have different lengths`);
        // }
    
        const transactionsSet = new Set<`${bigint}`>([...logTransactions, ...traceTransactions]); 
    
        // Ensure all log blocks have trace blocks
        for (const transactionIndex of transactionsSet) {
            const logTransactionHash = blockLogs?.transactions?.[transactionIndex]?.transactionHash;
            const traceTransactionHash = blockTraces?.transactions?.[transactionIndex]?.transactionHash;

            if (logTransactionHash && traceTransactionHash) {
                if (logTransactionHash !== traceTransactionHash) {
                    throw new Error(`transaction hash mismatch for transaction ${transactionIndex}: expected ${logTransactionHash}, got ${traceTransactionHash}`);
                }
            }
        }
    }
}

export function validateOld(state: any): void {
    const logBlocks = Object.keys(state.logs ?? {});
    const traceBlocks = Object.keys(state.traces ?? {});


    var tx = Object.keys(state.logs?.transactions ?? {});
    var rc = Object.keys(state.logs?.receipts ?? {});
    var tr = Object.keys(state.traces ?? {});

    var txSize = tx.length;
    var rcSize = rc.length;
    var trSize = tr.length;

    if (txSize === 0 && rcSize === 0 && trSize === 0) {
        return; // empty block, ok
    }

    // Ensure all transactions have receipts and traces
    for (const hash of tx) {
        const hasReceipt = rc.indexOf(hash) !== -1;
        const hasTrace = tr.indexOf(hash) !== -1;

        if (!hasReceipt || !hasTrace) {
            throw new Error(`transaction ${hash} not found in receipts or traces`);
        }
    }

    // Ensure all receipts have transactions and traces
    for (const hash of rc) {
        const hasTransaction = tx.indexOf(hash) !== -1;
        const hasTrace = tr.indexOf(hash) !== -1;

        if (!hasTransaction || !hasTrace) {
            throw new Error(`receipt ${hash} not found in transactions or traces`);
        }
    }

    // Check if reward trace is present
    // if (tr.indexOf("0x0000000000000000000000000000000000000000000000000000000000000000") !== -1) {
    //     console.warn("Reward trace found");
    // }
}