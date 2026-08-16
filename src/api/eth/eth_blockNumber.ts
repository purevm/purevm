import type { Quantity } from '@/types/shared.types.js';

// ============================================================================
// Types
// ============================================================================

export type EthBlockNumber = {
    method: "eth_blockNumber";
    params?: undefined;
    result: Quantity;
}