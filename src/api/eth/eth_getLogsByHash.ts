import type { Address, Hash, Hex } from '@/types/shared.types.js';
import type { RpcLog } from './types/log.js';

// ============================================================================
// Types
// ============================================================================

export type EthGetLogsByHash = {
    method: "eth_getLogs";
    params: [{
        blockHash: Hash;
        address?: Address | Address[];
        topics?: (null | Hex | Hex[])[];
    }];
    result: RpcLog[] | null;
}