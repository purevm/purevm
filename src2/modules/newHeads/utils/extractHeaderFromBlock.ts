import type { RpcBlock } from '../api/eth_getBlockByNumber.js';
import type { RpcHead } from '../api/eth_subscribeNewHeads.js';

/**
 * Block header type
 */
export type BlockHeader = {
    hash: `0x${string}`;
    parentHash: `0x${string}`;
    number: bigint;
    timestamp: number;
    receivedAt: number;
};

/**
 * Extracts a block header object from a polling or streaming block.
 */
export function extractHeaderFromBlock(block: RpcBlock | RpcHead): BlockHeader {
    if (!block.hash || !block.parentHash || !block.number || !block.timestamp) {
        throw new Error('Block is missing required fields');
    }
    return {
        hash: block.hash,
        parentHash: block.parentHash,
        number: BigInt(block.number),
        timestamp: Number(block.timestamp),
        receivedAt: Date.now(),
    }
}
