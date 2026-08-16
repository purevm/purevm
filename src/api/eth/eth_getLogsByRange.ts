import type { BlockTag, BlockNumber, Address, Hex } from '@/types/shared.types.js';
import type { RpcLog } from './types/log.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Filter object for the eth_getLogs RPC method.
 */
type EthGetLogsByRangeFilter = {
    fromBlock: BlockTag | BlockNumber;
    toBlock: BlockTag | BlockNumber;
    address?: Address | Address[];
    topics?: (null | Hex | Hex[])[];
}

/**
 * The parameters for the eth_getLogs RPC method.
 */
export type EthGetLogsByRange = {
    method: "eth_getLogs";
    params: [EthGetLogsByRangeFilter];
    result: RpcLog[] | null;
}
