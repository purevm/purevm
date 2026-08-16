import type { Address, Hex, Quantity, Hash, Index } from '@/types/shared.types.js';

// ============================================================================
// Transaction base
// ============================================================================

export type AccessList = readonly {
    /** Address whose storage keys may be accessed by the transaction. */
    address: Address
    /** Storage keys that may be accessed for the address. */
    storageKeys: readonly Hex[]
}[]

export type RpcAuthorization = {
    /** Address of the account or contract being authorized. */
    address: Address
    /** Chain ID for which the authorization is valid, encoded as hex. */
    chainId: Hex
    /** Nonce for the authorized account, encoded as hex. */
    nonce: Hex
    /** ECDSA signature r value. */
    r: Hex
    /** ECDSA signature s value. */
    s: Hex
    /** ECDSA signature y parity value. */
    yParity: Hex
}

export type RpcTransactionBase = {
    /** Hash of the block containing this transaction. */
    blockHash: Hash
    /** Number of the block containing this transaction, encoded as a hex quantity. */
    blockNumber: Quantity
    /** Unix timestamp of the containing block, encoded as a hex quantity if returned by the node. */
    blockTimestamp?: Quantity
    /** Index of this transaction in the containing block, encoded as a hex quantity. */
    transactionIndex: Index
    /** Address that submitted the transaction. */
    from: Address
    /** Recipient address, or null when the transaction creates a contract. */
    to: Address | null
    /** Gas limit provided by the sender, encoded as a hex quantity. */
    gas: Quantity
    /** Hash of this transaction. */
    hash: Hash
    /** Calldata or contract creation bytecode for this transaction. */
    input: Hex
    /** Sender account nonce, encoded as a hex quantity. */
    nonce: Index
    /** ECDSA signature r value. */
    r: Hex
    /** ECDSA signature s value. */
    s: Hex
    /** Legacy ECDSA recovery value, encoded as a hex quantity. */
    v: Quantity
    /** Amount of wei transferred, encoded as a hex quantity. */
    value: Quantity
}

// ============================================================================
// Transaction types (Legacy, EIP-2930, EIP-1559, EIP-4844, EIP-7702)
// ============================================================================

export type RpcTransactionLegacy = RpcTransactionBase & {
    /** Transaction type identifier for legacy transactions. */
    type: '0x0'
    /** Chain ID for replay protection, encoded as a hex quantity if returned by the node. */
    chainId?: Index
    /** Gas price selected by the sender, encoded as a hex quantity. */
    gasPrice: Quantity
}

export type RpcTransactionEIP2930 = RpcTransactionBase & {
    /** Transaction type identifier for EIP-2930 access-list transactions. */
    type: '0x1'
    /** Addresses and storage keys the transaction plans to access. */
    accessList: AccessList
    /** Chain ID for this transaction, encoded as a hex quantity. */
    chainId: Index
    /** Gas price selected by the sender, encoded as a hex quantity. */
    gasPrice: Quantity
    /** ECDSA signature y parity value, encoded as a hex quantity if returned by the node. */
    yParity?: Index
}

export type RpcTransactionEIP1559 = RpcTransactionBase & {
    /** Transaction type identifier for EIP-1559 dynamic-fee transactions. */
    type: '0x2'
    /** Addresses and storage keys the transaction plans to access. */
    accessList: AccessList
    /** Chain ID for this transaction, encoded as a hex quantity. */
    chainId: Index
    /** Maximum total fee per gas the sender is willing to pay, encoded as a hex quantity. */
    maxFeePerGas: Quantity
    /** Maximum priority fee per gas paid to the block producer, encoded as a hex quantity. */
    maxPriorityFeePerGas: Quantity
    /** ECDSA signature y parity value, encoded as a hex quantity if returned by the node. */
    yParity?: Index
}

export type RpcTransactionEIP4844 = RpcTransactionBase & {
    /** Transaction type identifier for EIP-4844 blob transactions. */
    type: '0x3'
    /** Addresses and storage keys the transaction plans to access. */
    accessList: AccessList
    /** Versioned hashes for the blobs attached to this transaction. */
    blobVersionedHashes: readonly Hex[]
    /** Chain ID for this transaction, encoded as a hex quantity. */
    chainId: Index
    /** Maximum total execution gas fee the sender is willing to pay, encoded as a hex quantity. */
    maxFeePerGas: Quantity
    /** Maximum execution gas priority fee paid to the block producer, encoded as a hex quantity. */
    maxPriorityFeePerGas: Quantity
    /** Maximum fee per blob gas the sender is willing to pay, encoded as a hex quantity. */
    maxFeePerBlobGas: Quantity
    /** ECDSA signature y parity value, encoded as a hex quantity if returned by the node. */
    yParity?: Index
}

export type RpcTransactionEIP7702 = RpcTransactionBase & {
    /** Transaction type identifier for EIP-7702 authorization transactions. */
    type: '0x4'
    /** Addresses and storage keys the transaction plans to access. */
    accessList: AccessList
    /** Authorizations attached to this transaction, if returned by the node. */
    authorizationList?: readonly RpcAuthorization[]
    /** Chain ID for this transaction, encoded as a hex quantity. */
    chainId: Index
    /** Maximum total fee per gas the sender is willing to pay, encoded as a hex quantity. */
    maxFeePerGas: Quantity
    /** Maximum priority fee per gas paid to the block producer, encoded as a hex quantity. */
    maxPriorityFeePerGas: Quantity
    /** ECDSA signature y parity value, encoded as a hex quantity if returned by the node. */
    yParity?: Index
}

export type RpcTransaction =
    | RpcTransactionLegacy
    | RpcTransactionEIP2930
    | RpcTransactionEIP1559
    | RpcTransactionEIP4844
    | RpcTransactionEIP7702