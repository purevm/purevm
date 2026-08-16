import type { BlockHeader } from '../../../modules/newHeads/index.js';

// ===========================================================
// Class
// ===========================================================

export class ChainHeadState {
    /** The current block */
    private currentBlock: BlockHeader;

    // ==========================
    // Constructor
    // ==========================

    constructor(header: BlockHeader) {
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
}
