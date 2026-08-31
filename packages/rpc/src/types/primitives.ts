export type Hex = `0x${string}`;
export type Address = Hex;
export type Hash = Hex;
export type BlockHash = Hash;
export type TransactionHash = Hash;
export type Quantity = Hex;
export type Index = Quantity;

export type BlockTag = "earliest" | "finalized" | "latest" | "pending" | "safe";
export type BlockNumber = Quantity;
export type BlockNumberOrTag = BlockNumber | BlockTag;
export type BlockReference = BlockHash | BlockNumberOrTag;
