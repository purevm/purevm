import type { RpcLog } from '../../../src/types.js';
import type { LogsByBlockNumber } from './getBlocksLogs.types.js';
import { hexToBigInt } from '../../../src/utils.js';

/**
 * Process the response from the getLogsByRange RPC method.
 * @param response - The response from the getLogsByRange RPC method.
 * @returns The sorted logs by block number and transaction hash.
 */
export function groupAndFormatLogs(response: RpcLog[]): LogsByBlockNumber {
    const sortedLogs: LogsByBlockNumber = {};

    for (const log of response) {
        const blockNumber = hexToBigInt(log.blockNumber).toString() as `${bigint}`;
        const transactionIndex = hexToBigInt(log.transactionIndex).toString() as `${bigint}`;
        const logIndex = hexToBigInt(log.logIndex).toString() as `${bigint}`;

        let blockData = sortedLogs[blockNumber];
        if (!blockData) {
            blockData = {
                blockHash: log.blockHash,
                blockNumber: blockNumber,
                blockTimestamp: log.blockTimestamp ? hexToBigInt(log.blockTimestamp).toString() as `${bigint}` : undefined,
                transactions: {},
            };
            sortedLogs[blockNumber] = blockData;
        } else if (blockData.blockHash !== log.blockHash) {
            throw new Error(`Block hash mismatch for block ${blockNumber}: expected ${blockData.blockHash}, got ${log.blockHash}`);
        }

        let transactionData = blockData.transactions[transactionIndex];
        if (!transactionData) {
            transactionData = {
                transactionHash: log.transactionHash,
                transactionIndex: transactionIndex,
                logs: {},
            };
            blockData.transactions[transactionIndex] = transactionData;
        } else if (transactionData.transactionHash !== log.transactionHash) {
            throw new Error(
                `Transaction hash mismatch for index ${transactionIndex}: expected ${transactionData.transactionHash}, got ${log.transactionHash}`,
            );
        }

        if (transactionData.logs[logIndex]) {
            throw new Error(`Log index ${logIndex} already exists for transaction ${transactionIndex}`);
        }
        
        transactionData.logs[logIndex] = {
            address: log.address,
            data: log.data,
            logIndex: log.logIndex,
            topics: log.topics,
            removed: log.removed,
        };
    }

    return sortedLogs;
}
