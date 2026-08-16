import type { Hash } from '@/types/shared.types.js';
import type { RpcTransaction } from './types/transaction.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetTransactionByHash = {
    method: "eth_getTransactionByHash";
    params: [
        transactionHash: Hash,
    ];
    result: RpcTransaction | null;
}