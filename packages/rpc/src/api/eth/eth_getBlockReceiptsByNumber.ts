import type { BlockNumber, BlockTag } from '@/types/shared.types.js'; 
import type { RpcTransactionReceipt } from './types/receipt.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetBlockReceiptsByNumber = {
    method: "eth_getBlockReceipts";
    params: [
        blockNumber: BlockNumber | BlockTag,
    ];
    result: RpcTransactionReceipt[] | null;
}