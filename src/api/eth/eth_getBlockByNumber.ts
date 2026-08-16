import type { BlockTag, BlockNumber } from '@/types/shared.types.js';
import type { RpcBlock } from './types/block.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetBlockByNumber<includeTransactions extends boolean> = {
    method: "eth_getBlockByNumber";
    params: [
        blockNumber: BlockNumber | BlockTag,
        includeTransactions: includeTransactions,
    ];
    result: RpcBlock<includeTransactions> | null;
}
