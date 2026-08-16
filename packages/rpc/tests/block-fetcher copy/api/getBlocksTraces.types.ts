import type { Address, Quantity, Hex, Hash } from '../../../src/types.js';

/**
 * A standardized call trace.
 */
export type CallTrace = {
    /** The type of call ("CALL", "CALLCODE", "STATICCALL", or "DELEGATECALL") */
    type: "CALL" | "CALLCODE" | "STATICCALL" | "DELEGATECALL"
    /** The address of the caller */
    from: Address
    /** The address of the callee (recipient) */
    to: Address
    /** The input data for the call */
    input: "0x" | Hex
    /** The output data from the call (if successful) */
    output?: "0x" | Hex | null
    /** The amount of gas provided for the call */
    gas: Quantity
    /** The amount of gas used by the call (if successful) */
    gasUsed?: Quantity | null
    /** The value transferred in the call */
    value: Quantity
    /** The trace address/path within the transaction (call tree) */
    path: number[]
    /** The error encountered during the trace (if any) */
    error?: string | null
}

/**
 * A standardized creation trace.
 */
export type CreationTrace = {
    /** The creation method ("CREATE" or "CREATE2") */
    type: "CREATE" | "CREATE2"
    /** The address of the creator (sender) */
    from: Address
    /** The contract address created (if available) */
    to?: Address | null
    /** Initialization code used in contract creation */
    input: "0x" | Hex
    /** The returned contract code (if successful) */
    output?: "0x" | Hex | null
    /** Value transferred to the new contract */
    value: Quantity
    /** Gas provided for contract creation */
    gas: Quantity
    /** Gas used during contract creation (if successful) */
    gasUsed?: Quantity | null
    /** The trace address/path within the transaction (call tree) */
    path: number[]
    /** Error encountered during contract creation (if any) */
    error?: string | null
}

/**
 * A standardized destruction trace.
 */
export type DestructionTrace = {
    /** The type of destruction: "SELFDESTRUCT" or "SUICIDE" */
    type: "SELFDESTRUCT" | "SUICIDE"
    /** The contract/address being destroyed */
    from: Address
    /** The refund address receiving the remaining funds */
    to: Address
    /** The contract's remaining balance transferred to the refund address */
    value: Quantity
    /** The trace address/path within the transaction (call tree) */
    path: number[]
    /** Error encountered during destruction (if any) */
    error?: string | null
}

/**
 * A standardized reward trace.
 */
export type RewardTrace = {
    /** The type of trace */
    type: "REWARD"
    /** Reward subtype */
    rewardType: "BLOCK" | "UNCLE" | "EXTERNAL"
    /** Beneficiary address receiving the reward */
    to: Address
    /** Reward amount */
    value: Quantity
    /** Trace path */
    path: number[]
    /** Trace error, usually undefined */
    error?: string | null
}

/**
 * A standardized trace attached to a transaction.
 */
export type TransactionTrace = (
    | DestructionTrace
    | CreationTrace
    | CallTrace
) & {
    /** Nested child traces. */
    subTraces?: TransactionTrace[];
}

/**
 * A standardized trace attached to a block.
 * Can be a transaction trace or a reward trace.
 */
export type Trace = (
    | TransactionTrace
    | RewardTrace
)

/**
 * Transaction data with its trace tree.
 */
export type TransactionTraces = {
    /** Hash of the transaction. */
    transactionHash: Hash
    /** Index of the transaction inside the block. (-1 for reward traces) */
    transactionIndex: '-1' | `${bigint}`
    /** Root trace frame. */
    traces: TransactionTrace[];
}

/**
 * Block data with transaction traces.
 */
export type BlockTraces = {
    /** Hash of the block. */
    blockHash: Hash
    /** Number of the block. */
    blockNumber: `${bigint}`
    /** Reward traces. */
    rewards: RewardTrace[];
    /** Transactions keyed by transaction index. (-1 for reward traces) */
    transactions: {
        [transactionIndex: '-1' | `${bigint}`]: TransactionTraces
    }
}

/**
 * Block traces by block number.
 */
export type BlocksTraces = {
    [blockNumber: `${bigint}`]: BlockTraces
}
