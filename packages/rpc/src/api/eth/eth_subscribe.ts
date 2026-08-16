import type { Address, Hex } from '@/types/shared.types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Filter object for "logs" subscriptions.
 */
export type EthSubscribeLogsFilter = {
    address?: Address | Address[];
    topics?: (Hex | Hex[] | null)[];
};

/**
 * The parameters for the eth_subscribe RPC method.
 */
export type EthSubscribeParams =
    | [subscription: "syncing"]
    | [subscription: "newHeads"]
    | [subscription: "logs", filter?: EthSubscribeLogsFilter]
    | [subscription: "newPendingTransactions", fullTransactions?: boolean];

/**
 * eth_subscribe RPC request parameters.
 */
export type EthSubscribe = {
    method: "eth_subscribe";
    params: EthSubscribeParams;
    result: Hex; // subscription id, e.g. "0x9cef478923ff08bf67fde6c64013158d"
};