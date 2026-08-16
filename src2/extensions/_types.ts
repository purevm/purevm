import type { Address, Quantity, Hex } from '@/types/shared.types.js';

// ===========================================================
// Type definitions
// ===========================================================

/**
 * Call trace type
 */
export type CallTrace = {
    /** The type of trace */
    type: "CALL" | "CALLCODE" | "STATICCALL" | "DELEGATECALL";
    /** The address of the caller */
    from: Address;
    /** The address of the recipient */
    to?: Address | undefined;
    /** The input of the trace */
    input: Hex | "0x" | "0x0";
    /** The output of the trace */
    output: Hex | "0x" | "0x0";
    /** The value of the trace */
    value: Quantity;
    /** The path of the trace */
    path: number[];
    /** The error of the trace */
    error?: string | undefined;
};

/**
 * Creation trace type
 */
export type CreationTrace = {
    /** The type of trace */
    type: "CREATE" | "CREATE2";
    /** The address of the caller */
    from: Address;
    /** The address of the recipient */
    to?: Address | undefined;
    /** The input of the trace */
    input: Hex | "0x" | "0x0";
    /** The output of the trace */
    output: Hex | "0x" | "0x0";
    /** The value of the trace */
    value: Quantity;
    /** The path of the trace */
    path: number[];
    /** The error of the trace */
    error?: string | undefined;
};

/**
 * Destruction trace type
 */
export type DestructionTrace = {
    /** The type of trace */
    type: "SELFDESTRUCT" | "SUICIDE";
    /** The contract/address being self-destructed */
    from: Address;
    /** The address receiving funds */
    to: Address;
    /** The contract's remaining balance */
    value: Quantity;
    /** The path of the trace */
    path: number[];
    /** The error of the trace */
    error?: string | undefined;
};

/**
 * Reward trace type
 */
export type RewardTrace = {
    /** The type of trace */
    type: "REWARD";
    /** Beneficiary address receiving the reward */
    to: Address;
    /** Reward amount */
    value: Quantity;
    /** Reward subtype */
    rewardType: "block" | "uncle" | "external";
    /** Trace path */
    path: number[];
    /** Trace error, usually undefined */
    error?: string | undefined;
};

// ===========================================================
// Types
// ===========================================================

export type Trace = 
    | DestructionTrace
    | CreationTrace
    | CallTrace
    | RewardTrace;