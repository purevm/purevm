import type { Address, Hex, Quantity, Hash, Index } from '@/types/shared.types.js';
import type { RpcTransaction } from './transaction.js';
import type { RpcLog } from './log.js';

// ============================================================================
// Receipt Types
// ============================================================================

/** The status of the transaction execution (0x0 for revert, 0x1 for success). */
export type RpcReceiptStatus = '0x0' | '0x1';

/** The type of the transaction. */
export type RpcTransactionType = RpcTransaction['type'] | (string & {});

export type RpcTransactionReceipt = {
    /** Actual blob gas price paid by this transaction, if it is an EIP-4844 blob transaction. */
    blobGasPrice?: Quantity
    /** Blob gas used by this transaction, if it is an EIP-4844 blob transaction. */
    blobGasUsed?: Quantity
    /** Hash of the block containing this transaction. */
    blockHash: Hash
    /** Number of the block containing this transaction, encoded as a hex quantity. */
    blockNumber: Quantity
    /** Unix timestamp of the containing block, encoded as a hex quantity if returned by the node. */
    blockTimestamp?: Quantity
    /** Address of the created contract, or null if the transaction did not create a contract. */
    contractAddress: Address | null
    /** Total gas used in the block up to and including this transaction, encoded as a hex quantity. */
    cumulativeGasUsed: Quantity
    /** Effective gas price paid for execution gas, encoded as a hex quantity. */
    effectiveGasPrice: Quantity
    /** Address that submitted the transaction. */
    from: Address
    /** Gas used by this transaction, encoded as a hex quantity. */
    gasUsed: Quantity
    /** Logs emitted while executing this transaction. */
    logs: RpcLog[]
    /** Bloom filter for the logs emitted by this transaction. */
    logsBloom: Hex
    /** Post-transaction state root, only present for pre-Byzantium transactions. */
    root?: Hash
    /** Transaction execution status: 0x1 for success, 0x0 for revert. */
    status: RpcReceiptStatus
    /** Recipient address, or null when the transaction created a contract. */
    to: Address | null
    /** Hash of this transaction. */
    transactionHash: Hash
    /** Index of this transaction within the containing block, encoded as a hex quantity. */
    transactionIndex: Index
    /** Transaction type identifier. */
    type: RpcTransactionType
}
