import { ethGetBlockByNumber, type RpcBlock } from '../../modules/newHeads.js';
import { extractHeaderFromBlock, type BlockHeader } from '../../modules/newHeads.js';

// ===========================================================
// Handler
// ===========================================================

export async function initBlock(httpUrl: string): Promise<BlockHeader> {
    // Fetch the block
    const block = await ethGetBlockByNumber(httpUrl, "latest");

    // Extract the header
    const header = extractHeaderFromBlock(block);

    return header;
}
