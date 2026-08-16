import type { BlockHeader, BlockData } from '../../../modules/newHeads/index.js';
import { ChainHeadState } from '../stores/ChainHeadState.js';

// ===========================================================
// Type
// ===========================================================

export type EventType = "normal" | "reorg" | "missing";

type BlockHandlerDeps = {
    header: BlockHeader;
    onEvent: (type: EventType, block: BlockData, header: BlockHeader) => void;
    onLog?: (...args: any[]) => void;
    debug?: boolean;
};

// ===========================================================
// Handler
// ===========================================================

export function createBlockHandlers({ header, onEvent, onLog, debug }: BlockHandlerDeps) {
    let state = new ChainHeadState(header);

    // ===========================================================
    // Private
    // ===========================================================

    /**
     * Handles the case where the next block is received (normal or reorg).
     */
    const handleNextBlock = (block: BlockData, header: BlockHeader): void => {
        let eventType: EventType = 'normal';

        // Parent hash mismatch
        if (state.blockHash !== header.parentHash) {
            eventType = 'reorg';

            onLog?.(`(reorg) block ${block.number} does not connect to previous block:`, {
                previousHash: state.blockHash,
                expectedHash: block.parentHash,
            });
        }

        if (debug) {
            // Show time between mint and receive
            timeBetweenBlocks(eventType, header); 
        }
        onEvent(eventType, block, header);
    };

    /**
     * Handles the case where the same block number is received (duplicate or reorg with different hash).
     */
    const handleSameBlock = (block: BlockData, header: BlockHeader): void => {
        // Duplication
        if (state.blockHash === header.hash) {
            onLog?.(`(duplicate) block ${block.number} is already known`);
            return;
        }

        // Reorg (block replaced)
        onLog?.(`(reorg) different hash for same block received: ${block.number}.`, {
            currentHash: state.blockHash,
            receivedHash: block.hash,
        });

        onEvent('reorg', block, header);
    };

    /**
     * Handles the case where a missing block is detected.
     */
    const handleMissingBlock = (block: BlockData, header: BlockHeader): void => {
        const gap = header.number - state.blockNumber - 1n;

        // Log
        onLog?.(`(missing) ${gap} missing blocks:`, {
            current: state.blockNumber,
            received: block.number,
        });

        onEvent('missing', block, header);
    };

    /**
     * Handles the case where an old block is received (reorg or slow network).
     */
    const handleOldBlock = (block: BlockData, header: BlockHeader): void => {
        // Log
        onLog?.(`(old) block ${header.number} is older than current block:`, {
            current: state.blockNumber,
            received: header.number,
        });
    };

    /**
     * Handles undefined or unexpected case.
     */
    const handleUndefinedCase = (block: BlockData, header: BlockHeader): void => {
        // Log
        onLog?.(`(undefined) block ${block.number} is not expected:`, {
            current: state.blockNumber,
            received: block.number,
        });
    };

    /**
     * Handles the time between blocks.
     */
    const timeBetweenBlocks = (eventType: EventType, header: BlockHeader): void => {
        const currentBlock = state.getCurrentBlock();

        const mintedAtMs = Number(header.timestamp) * 1_000;
        const mintToReceiveSeconds = (header.receivedAt - mintedAtMs) / 1_000;
        const lastToCurrentSeconds = (header.receivedAt - currentBlock.receivedAt) / 1_000;
    
        onLog?.(
            `${eventType} - ${header.number} (mint→receive: ${mintToReceiveSeconds.toFixed(2)}s) (prev→current: ${lastToCurrentSeconds.toFixed(2)}s)`
        );
    };

    // ===========================================================
    // Public
    // ===========================================================

    /**
     * Handles the case where the next block is received (normal or reorg).
     */
    return (block: BlockData, header: BlockHeader): void => {
        // CASE: Missing block (gap)
        if (header.number > state.blockNumber + 1n) {
            handleMissingBlock(block, header);
            state.setCurrentBlock(header);
        }

        // CASE: Next block (normal)
        else if (header.number === state.blockNumber + 1n) {
            handleNextBlock(block, header);
            state.setCurrentBlock(header);
        }

        // CASE: Same block (duplicate or reorg)
        else if (header.number === state.blockNumber) {
            handleSameBlock(block, header);
            state.setCurrentBlock(header);
        }

        // CASE: Old block (slow network or reorg)
        else if (header.number < state.blockNumber) {
            handleOldBlock(block, header);
        }

        // CASE: undefined (unexpected situation)
        else {
            handleUndefinedCase(block, header);
        }
    };
}
