import type { Quantity } from '@/types/shared.types.js';

// ============================================================================
// Types
// ============================================================================

export type EthChainId = {
    method: "eth_chainId";
    params?: undefined;
    result: Quantity;
}