import type { Client } from '../client.js';
import type { RpcTransactionReceipt } from '../types/viem.types.js';
import type { BlockNumber, BlockHash } from '../types/shared.types.js';

// ===========================================================
// Types
// ===========================================================

export type Receipt = RpcTransactionReceipt;

export type Receipts = { [transactionHash: `0x${string}`]: Receipt };

// ===========================================================
// Function definition
// ===========================================================

export async function getBlockReceiptsByNumber(client: Client, blockNumber: BlockNumber) {
    const response = await client.eth.ethGetBlockReceiptsByNumber(blockNumber);
    return processResponse(response);
}

export async function getBlockReceiptsByHash(client: Client, blockHash: BlockHash) {
    const response = await client.eth.ethGetBlockReceiptsByHash(blockHash);
    return processResponse(response);
}

// ===========================================================
// Private Functions
// ===========================================================

function processResponse(response: RpcTransactionReceipt[]) {
    const receiptsByHash: Receipts = {};

    for (const receipt of response) {
        const transactionHash = receipt.transactionHash.toLowerCase() as `0x${string}`;
        receiptsByHash[transactionHash] = receipt;
    }

    return {
        receipts: receiptsByHash,
    };
}