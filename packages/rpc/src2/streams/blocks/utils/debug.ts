import type { BlockHeader, BlockData } from '../../../modules/newHeads/index.js';
import { ChainHeadState } from '../stores/ChainHeadState.js';

// ===========================================================
// Handler
// ===========================================================

/**
 * Handles the time between blocks.
 */
export const timeBetweenBlocks = (newHeader: BlockHeader, currentHeader: BlockHeader): { mintToReceiveSeconds: number, lastToCurrentSeconds: number } => {
    const mintedAtMs = Number(newHeader.timestamp) * 1_000;
    const mintToReceiveSeconds = (newHeader.receivedAt - mintedAtMs) / 1_000;
    const lastToCurrentSeconds = (newHeader.receivedAt - currentHeader.receivedAt) / 1_000;

    return {
        mintToReceiveSeconds,
        lastToCurrentSeconds,
    };
};