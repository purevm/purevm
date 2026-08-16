import type { BlockHeader, RpcBlock, RpcHead } from '../../../modules/newHeads/index.js';

// ===========================================================
// Type
// ===========================================================

type EventType = "normal" | "reorg" | "missing";

type BlockData = RpcBlock | RpcHead;

type ChainHeadStateDeps = {
    header: BlockHeader;
    onEvent: (event: EventType, block: BlockData, header: BlockHeader) => void;
    onLog?: (...args: any[]) => void;
    debug?: boolean;
};

// ===========================================================
// Class
// ===========================================================

export class ChainHeadState {
    /** The current block */
    private currentBlock: BlockHeader;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private header: BlockHeader, 
        private readonly opts: ChainHeadStateDeps
    ) {
        this.currentBlock = header;
    }

    // ==========================
    // Public Getters
    // ==========================

    public get blockNumber(): bigint {
        return this.currentBlock.number;
    }

    public get blockHash(): `0x${string}` {
        return this.currentBlock.hash;
    }

    // ==========================
    // Public Methods
    // ==========================

    public setCurrentBlock(block: BlockHeader): void {
        this.currentBlock = block;
    }

    public getCurrentBlock(): BlockHeader {
        return this.currentBlock;
    }

    // ==========================
    // Private Methods
    // ==========================

    private handleNextBlock(block: BlockData, header: BlockHeader): void {
        let eventType: EventType = 'normal';

        // Parent hash mismatch
        if (this.currentBlock.hash !== block.parentHash) {
            eventType = 'reorg';

            this.opts.onLog?.(`(reorg) block ${block.number} does not connect to previous block:`, {
                previousHash: this.currentBlock.hash,
                expectedHash: block.parentHash,
            });
        }

        // Emit new block
        this.opts.onEvent(eventType, block, header);
    }

    private handleSameBlock(block: BlockData, header: BlockHeader): void {
        // Duplication
        if (this.currentBlock.hash === header.hash) {
            this.opts.onLog?.(`(duplicate) block ${block.number} is already known`);
            return;
        }

        // Reorg (block replaced)
        this.opts.onLog?.(`(reorg) different hash for same block received: ${block.number}.`, {
            currentHash: this.currentBlock.hash,
            receivedHash: block.hash,
        });

        // Emit reorg event
        this.opts.onEvent('reorg', block, header);
    }

    private handleMissingBlock(block: BlockData, header: BlockHeader): void {
        const gap = header.number - this.currentBlock.number - 1n;

        // Log
        this.opts.onLog?.(`(missing) ${gap} missing blocks:`, {
            current: this.currentBlock.number,
            received: block.number,
        });

        // Emit gap event
        this.opts.onEvent('missing', block, header);
    }

    private handleOldBlock(block: BlockData, header: BlockHeader): void {
        // Log
        this.opts.onLog?.(`(old) block ${block.number} is older than current block:`, {
            current: this.currentBlock.number,
            received: block.number,
        });
    }
}
