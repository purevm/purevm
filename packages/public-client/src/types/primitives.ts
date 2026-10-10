/** `0x`-prefixed byte data or hex-encoded quantity. */
export type Hex = `0x${string}`;
/** Twenty-byte Ethereum account or contract address. */
export type Address = Hex;
/** Thirty-two-byte Keccak hash. */
export type Hash = Hex;
/** Hash identifying an execution block. */
export type BlockHash = Hash;
/** Hash identifying an Ethereum transaction. */
export type TransactionHash = Hash;
/** Unsigned integer encoded as the smallest possible `0x`-prefixed hexadecimal value. */
export type Quantity = Hex;
/** Collection position encoded as a JSON-RPC hex quantity. */
export type Index = Quantity;
/** Named execution-state position accepted by Ethereum JSON-RPC methods. */
export type BlockTag = "earliest" | "finalized" | "latest" | "pending" | "safe";
/** Execution block number encoded as a JSON-RPC hex quantity. */
export type BlockNumber = Quantity;
/** Block number or named execution-state position. */
export type BlockNumberOrTag = BlockNumber | BlockTag;
/** Any selector that identifies a block by hash, number, or tag. */
export type BlockReference = BlockHash | BlockNumberOrTag;
/** EIP-1898 block selector by hash. `requireCanonical` rejects blocks outside the canonical chain. */
export type BlockHashReference = {
  blockHash: BlockHash;
  requireCanonical?: boolean | undefined;
};
