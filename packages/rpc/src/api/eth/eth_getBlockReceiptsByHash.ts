import type { BlockHash } from '@/types/shared.types.js';  
import type { RpcTransactionReceipt } from './types/receipt.js';  

// ============================================================================
// Types
// ============================================================================

export type EthGetBlockReceiptsByHash = {
    method: "eth_getBlockReceipts";
    params: [
        blockHash: BlockHash,
    ];
    result: RpcTransactionReceipt[] | null;
}