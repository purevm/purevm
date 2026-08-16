import type { Address, BlockNumber, BlockTag, Hex } from '@/types/shared.types.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetCode = {
    method: "eth_getCode";
    params: [
        address: Address,
        block: BlockNumber | BlockTag,
    ];
    result: Hex | "0x";
}
