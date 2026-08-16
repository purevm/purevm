// ============================================================================
// SHARED TYPES
// ============================================================================

/** Hex types */
export type Hex = `0x${string}`;

/** Hash types */
export type Hash = `0x${string}`;

/** Address types */
export type Address = `0x${string}`;

/** Quantity types */
export type Quantity = `0x${string}`;

/** Index types */
export type Index = `0x${string}`

/** The tag of the block to get */
export type BlockTag = "latest" | "earliest" | "safe" | "finalized";

/** The hash of the block to get (64 characters) */
export type BlockHash = `0x${string}`;

/** The number in hexadecimal of the block to get */
export type BlockNumber = `0x${string}`;

/** The hash identifying a transaction (64 characters) */
export type TransactionHash = `0x${string}`;
