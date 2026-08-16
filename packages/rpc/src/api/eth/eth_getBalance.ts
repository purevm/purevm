import type { Address, BlockNumber, BlockTag, Quantity } from '@/types/shared.types.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetBalance = {
    method: "eth_getBalance";
    params: [
        address: Address,
        block: BlockNumber | BlockTag,
    ];
    result: Quantity;
}