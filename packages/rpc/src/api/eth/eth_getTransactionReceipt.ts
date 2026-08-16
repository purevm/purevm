import type { Hash } from '@/types/shared.types.js';
import type { RpcTransactionReceipt } from './types/receipt.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetTransactionReceipt = {
    method: "eth_getTransactionReceipt";
    params: [
        hash: Hash,
    ];
    result: RpcTransactionReceipt | null;
}