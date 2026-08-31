import type {
  Address,
  BlockHash,
  BlockNumberOrTag,
  Hash,
  Hex,
  Index,
  Quantity,
} from "../../types/primitives.js";

export type AccessList = readonly {
  /** Account whose storage may be accessed by the transaction. */
  address: Address;
  /** Storage slots that may be accessed for this account. */
  storageKeys: readonly Hex[];
}[];

export type RpcAuthorization = {
  /** Account or contract receiving delegated authority. */
  address: Address;
  /** Chain ID for which the authorization is valid, encoded as a hex quantity. */
  chainId: Quantity;
  /** Nonce of the authorizing account, encoded as a hex quantity. */
  nonce: Quantity;
  /** ECDSA signature `r` value. */
  r: Hex;
  /** ECDSA signature `s` value. */
  s: Hex;
  /** ECDSA signature parity, encoded as a hex quantity. */
  yParity: Quantity;
};

export type RpcTransactionBase = {
  /** Hash of the containing block, or null while the transaction is pending. */
  blockHash: Hash | null;
  /** Number of the containing block, or null while pending. */
  blockNumber: Quantity | null;
  /** Timestamp of the containing block when supplied by the node. */
  blockTimestamp?: Quantity;
  /** Address that signed and submitted the transaction. */
  from: Address;
  /** Gas limit supplied by the sender. */
  gas: Quantity;
  /** Transaction hash. */
  hash: Hash;
  /** Calldata or contract creation bytecode. */
  input: Hex;
  /** Sender account nonce. */
  nonce: Quantity;
  /** ECDSA signature `r` value. */
  r: Hex;
  /** ECDSA signature `s` value. */
  s: Hex;
  /** Recipient, or null for contract creation. */
  to: Address | null;
  /** Position in the containing block, or null while pending. */
  transactionIndex: Index | null;
  /** Legacy ECDSA recovery value. */
  v: Quantity;
  /** Amount of wei transferred. */
  value: Quantity;
};

export type RpcTransactionLegacy = RpcTransactionBase & {
  /** Replay-protection chain ID when returned by the node. */
  chainId?: Quantity;
  /** Gas price selected by the sender, in wei per gas. */
  gasPrice: Quantity;
  /** Legacy transaction type identifier. */
  type: "0x0";
};

export type RpcTransactionEip2930 = RpcTransactionBase & {
  /** Accounts and storage slots declared by the transaction. */
  accessList: AccessList;
  /** Transaction chain ID. */
  chainId: Quantity;
  /** Gas price selected by the sender, in wei per gas. */
  gasPrice: Quantity;
  /** EIP-2930 access-list transaction type identifier. */
  type: "0x1";
  /** ECDSA signature parity when returned by the node. */
  yParity?: Quantity;
};

export type RpcTransactionEip1559 = RpcTransactionBase & {
  /** Accounts and storage slots declared by the transaction. */
  accessList: AccessList;
  /** Transaction chain ID. */
  chainId: Quantity;
  /** Maximum total fee the sender accepts, in wei per gas. */
  maxFeePerGas: Quantity;
  /** Maximum miner priority fee, in wei per gas. */
  maxPriorityFeePerGas: Quantity;
  /** EIP-1559 dynamic-fee transaction type identifier. */
  type: "0x2";
  /** ECDSA signature parity when returned by the node. */
  yParity?: Quantity;
};

export type RpcTransactionEip4844 = RpcTransactionBase & {
  /** Accounts and storage slots declared by the transaction. */
  accessList: AccessList;
  /** Versioned hashes of blobs attached to the transaction. */
  blobVersionedHashes: readonly Hex[];
  /** Transaction chain ID. */
  chainId: Quantity;
  /** Maximum fee the sender accepts, in wei per blob gas. */
  maxFeePerBlobGas: Quantity;
  /** Maximum total execution fee, in wei per gas. */
  maxFeePerGas: Quantity;
  /** Maximum execution priority fee, in wei per gas. */
  maxPriorityFeePerGas: Quantity;
  /** EIP-4844 blob transaction type identifier. */
  type: "0x3";
  /** ECDSA signature parity when returned by the node. */
  yParity?: Quantity;
};

export type RpcTransactionEip7702 = RpcTransactionBase & {
  /** Accounts and storage slots declared by the transaction. */
  accessList: AccessList;
  /** EIP-7702 authorizations when returned by the node. */
  authorizationList?: readonly RpcAuthorization[];
  /** Transaction chain ID. */
  chainId: Quantity;
  /** Maximum total fee the sender accepts, in wei per gas. */
  maxFeePerGas: Quantity;
  /** Maximum miner priority fee, in wei per gas. */
  maxPriorityFeePerGas: Quantity;
  /** EIP-7702 authorization transaction type identifier. */
  type: "0x4";
  /** ECDSA signature parity when returned by the node. */
  yParity?: Quantity;
};

export type RpcTransaction =
  | RpcTransactionLegacy
  | RpcTransactionEip2930
  | RpcTransactionEip1559
  | RpcTransactionEip4844
  | RpcTransactionEip7702;

export type Withdrawal = {
  /** Address receiving withdrawn validator funds. */
  address: Address;
  /** Amount withdrawn, denominated in Gwei. */
  amount: Quantity;
  /** Withdrawal index. */
  index: Index;
  /** Index of the validator associated with this withdrawal. */
  validatorIndex: Index;
};

export type RpcBlock<includeTransactions extends boolean = boolean> = {
  /** Base fee in wei per gas, absent on pre-EIP-1559 blocks. */
  baseFeePerGas?: Quantity;
  /** Blob gas consumed by EIP-4844 transactions in this block. */
  blobGasUsed?: Quantity;
  /** Legacy proof-of-work difficulty. */
  difficulty: Quantity;
  /** Excess blob gas used to calculate this block's blob base fee. */
  excessBlobGas?: Quantity;
  /** Arbitrary data supplied by the block producer. */
  extraData: Hex;
  /** Maximum gas allowed in this block. */
  gasLimit: Quantity;
  /** Total gas consumed by transactions in this block. */
  gasUsed: Quantity;
  /** Block hash, or null for a pending block. */
  hash: Hash | null;
  /** Bloom filter covering every log in the block, or null while pending. */
  logsBloom: Hex | null;
  /** Block beneficiary, miner, or fee recipient. */
  miner: Address;
  /** Proof-of-work mix hash or post-merge `prevRandao` value. */
  mixHash: Hash;
  /** Proof-of-work nonce, or null for a pending block. */
  nonce: Hex | null;
  /** Block number, or null for a pending block. */
  number: Quantity | null;
  /** Root of the parent beacon block, when supported by the fork. */
  parentBeaconBlockRoot?: Hash;
  /** Hash of the parent execution block. */
  parentHash: Hash;
  /** Root of the transaction receipts trie. */
  receiptsRoot: Hash;
  /** Root of execution requests introduced by EIP-7685, when supported. */
  requestsHash?: Hash;
  /** Additional consensus-engine seal fields returned by some clients. */
  sealFields?: Hex[];
  /** Keccak hash of the encoded uncle list. */
  sha3Uncles: Hash;
  /** Encoded block size in bytes. */
  size: Quantity;
  /** Root of the post-execution state trie. */
  stateRoot: Hash;
  /** Unix timestamp at which the block was produced. */
  timestamp: Quantity;
  /** Cumulative proof-of-work difficulty, absent on some post-merge nodes. */
  totalDifficulty?: Quantity;
  /** Transaction hashes or complete objects according to the request flag. */
  transactions: includeTransactions extends true ? RpcTransaction[] : Hash[];
  /** Root of the transactions trie. */
  transactionsRoot: Hash;
  /** Hashes of uncle blocks included by this block. */
  uncles: Hash[];
  /** Validator withdrawals, when supported by the fork. */
  withdrawals?: Withdrawal[];
  /** Root of the withdrawals trie, when supported by the fork. */
  withdrawalsRoot?: Hash;
};

export type RpcLog = {
  /** Contract that emitted the log. */
  address: Address;
  /** Hash of the containing block, or null for a pending log. */
  blockHash: Hash | null;
  /** Number of the containing block, or null for a pending log. */
  blockNumber: Quantity | null;
  /** Timestamp of the containing block when supplied by the node. */
  blockTimestamp?: Quantity;
  /** Non-indexed event data. */
  data: Hex;
  /** Position within the block, or null for a pending log. */
  logIndex: Index | null;
  /** Whether the log was removed by a chain reorganization. */
  removed: boolean;
  /** Indexed event values; the first item is usually the event signature. */
  topics: Hex[];
  /** Emitting transaction hash, or null for a pending log. */
  transactionHash: Hash | null;
  /** Transaction position in the block, or null for a pending log. */
  transactionIndex: Index | null;
};

/** Transaction execution status: `0x0` for failure or `0x1` for success. */
export type RpcReceiptStatus = "0x0" | "0x1";

/** Known transaction type identifiers plus future hex-encoded identifiers. */
export type RpcTransactionType = RpcTransaction["type"] | (Quantity & {});

export type RpcTransactionReceipt = {
  /** Blob gas price paid, in wei, for an EIP-4844 transaction. */
  blobGasPrice?: Quantity;
  /** Blob gas consumed by an EIP-4844 transaction. */
  blobGasUsed?: Quantity;
  /** Hash of the block containing the transaction. */
  blockHash: Hash;
  /** Number of the block containing the transaction. */
  blockNumber: Quantity;
  /** Timestamp of the containing block when supplied by the node. */
  blockTimestamp?: Quantity;
  /** Created contract address, or null for a regular call. */
  contractAddress: Address | null;
  /** Gas consumed in the block up to and including this transaction. */
  cumulativeGasUsed: Quantity;
  /** Effective execution gas price paid, in wei per gas. */
  effectiveGasPrice: Quantity;
  /** Address that submitted the transaction. */
  from: Address;
  /** Gas consumed by this transaction. */
  gasUsed: Quantity;
  /** Logs emitted during transaction execution. */
  logs: RpcLog[];
  /** Bloom filter covering the transaction logs. */
  logsBloom: Hex;
  /** Post-transaction state root, present on pre-Byzantium receipts. */
  root?: Hash;
  /** Whether transaction execution succeeded or reverted. */
  status: RpcReceiptStatus;
  /** Recipient, or null when the transaction created a contract. */
  to: Address | null;
  /** Hash of the executed transaction. */
  transactionHash: Hash;
  /** Position of the transaction within its block. */
  transactionIndex: Index;
  /** Transaction envelope type identifier. */
  type: RpcTransactionType;
};

/** Topic selectors, including OR lists and null wildcards by position. */
export type LogTopics = readonly (Hex | readonly Hex[] | null)[];

export type LogsByHashFilter = {
  /** Contract address or addresses from which logs must originate. */
  address?: Address | readonly Address[];
  /** Exact block whose logs should be returned. */
  blockHash: BlockHash;
  /** Positional topic selectors. */
  topics?: LogTopics;
};

export type LogsByRangeFilter = {
  /** Contract address or addresses from which logs must originate. */
  address?: Address | readonly Address[];
  /** Inclusive first block; defaults are provider-specific. */
  fromBlock?: BlockNumberOrTag;
  /** Inclusive final block; defaults are provider-specific. */
  toBlock?: BlockNumberOrTag;
  /** Positional topic selectors. */
  topics?: LogTopics;
};

/** Log filters accepted by an `eth_subscribe` logs subscription. */
export type LogsSubscriptionFilter = Pick<LogsByRangeFilter, "address" | "topics">;
