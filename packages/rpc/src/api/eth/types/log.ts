import type { Address, Hex, Quantity, Hash, Index } from '@/types/shared.types.js';

// ============================================================================
// Log Types
// ============================================================================

export type RpcLog = {
    /** Address of the contract that emitted this log. */
    address: Address
    /** Hash of the block containing this log. */
    blockHash: Hash
    /** Number of the block containing this log, encoded as a hex quantity. */
    blockNumber: Quantity
    /** Unix timestamp of the containing block, encoded as a hex quantity if returned by the node. */
    blockTimestamp?: Quantity
    /** Non-indexed event data encoded as hex. */
    data: Hex
    /** Index of this log within the containing block, encoded as a hex quantity. */
    logIndex: Index
    /** Whether this log was removed due to a chain reorganization. */
    removed: boolean
    /** Event topics, where the first topic is usually the event signature hash. */
    topics: [Hex, ...Hex[]] | []
    /** Hash of the transaction that emitted this log. */
    transactionHash: Hash
    /** Index of the transaction that emitted this log, encoded as a hex quantity. */
    transactionIndex: Index
}
