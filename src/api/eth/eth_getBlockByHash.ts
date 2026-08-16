import type { BlockHash } from '@/types/shared.types.js';
import type { RpcBlock } from './types/block.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetBlockByHash<includeTransactions extends boolean> = { 
    method: "eth_getBlockByHash"; 
    params: [
        blockHash: BlockHash,
        includeTransactions: includeTransactions,
    ]; 
    result: RpcBlock<includeTransactions> | null;
}
