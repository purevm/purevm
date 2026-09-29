import type {
  Address,
  BlockHash,
  BlockNumber,
  BlockNumberOrTag,
  Hash,
  Hex,
  Index,
  Quantity,
} from "../../types/primitives.js";

/** Transaction-like input accepted by read-only call and gas simulation methods. */
export type RpcCallRequest = {
  /** EIP-2930 access list to warm before execution. */
  accessList?: AccessList | undefined;
  /** Versioned blob hashes used by an EIP-4844 call. */
  blobVersionedHashes?: readonly Hash[] | undefined;
  /** Calldata. `input` is preferred when both fields are supported by a provider. */
  data?: Hex | undefined;
  /** Sender used for state and balance checks. */
  from?: Address | undefined;
  /** Gas limit available to the simulated call. */
  gas?: Quantity | undefined;
  /** Legacy gas price. */
  gasPrice?: Quantity | undefined;
  /** Calldata using the modern transaction field name. */
  input?: Hex | undefined;
  /** Maximum fee per blob gas. */
  maxFeePerBlobGas?: Quantity | undefined;
  /** Maximum total fee per gas. */
  maxFeePerGas?: Quantity | undefined;
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas?: Quantity | undefined;
  /** Transaction nonce used by clients that support it for simulation. */
  nonce?: Quantity | undefined;
  /** Recipient, or null to simulate contract creation. */
  to?: Address | null | undefined;
  /** Wei transferred by the simulated call. */
  value?: Quantity | undefined;
};

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
  blockTimestamp?: Quantity | undefined;
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
  chainId?: Quantity | undefined;
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
  yParity?: Quantity | undefined;
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
  yParity?: Quantity | undefined;
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
  yParity?: Quantity | undefined;
};

export type RpcTransactionEip7702 = RpcTransactionBase & {
  /** Accounts and storage slots declared by the transaction. */
  accessList: AccessList;
  /** EIP-7702 authorizations when returned by the node. */
  authorizationList?: readonly RpcAuthorization[] | undefined;
  /** Transaction chain ID. */
  chainId: Quantity;
  /** Maximum total fee the sender accepts, in wei per gas. */
  maxFeePerGas: Quantity;
  /** Maximum miner priority fee, in wei per gas. */
  maxPriorityFeePerGas: Quantity;
  /** EIP-7702 authorization transaction type identifier. */
  type: "0x4";
  /** ECDSA signature parity when returned by the node. */
  yParity?: Quantity | undefined;
};

/** OP Stack deposit transaction (Optimism, Base, and other OP chains), created on L1. */
export type RpcTransactionOpDeposit = Omit<RpcTransactionBase, "r" | "s" | "v"> & {
  /** Version of the deposit receipt format. */
  depositReceiptVersion?: Quantity | undefined;
  /** Always `0x0` for deposits when returned. */
  gasPrice?: Quantity | undefined;
  /** Whether this is a system deposit that does not consume block gas. */
  isSystemTx?: boolean | undefined;
  /** ETH minted on L2 by the deposit, in wei. */
  mint?: Quantity | undefined;
  /** Deposits carry no signature; some clients return zeroed values. */
  r?: Hex | undefined;
  s?: Hex | undefined;
  /** Hash that uniquely identifies the L1 origin of the deposit. */
  sourceHash: Hash;
  /** OP Stack deposit transaction type identifier. */
  type: "0x7e";
  v?: Quantity | undefined;
};

declare const unknownTransactionType: unique symbol;

/**
 * Transaction type identifier this package does not model, such as Arbitrum `0x64` to `0x6a`,
 * zkSync `0x71`, or Celo `0x7b`. The brand keeps `tx.type === "0x2"` narrowing exact; compare an
 * unknown identifier with `String(tx.type) === "0x64"`.
 */
export type UnknownTransactionType = Quantity & { readonly [unknownTransactionType]: true };

/** Chain-specific transaction of an unmodeled type. Extra fields are kept as returned. */
export type RpcTransactionUnknown = Omit<RpcTransactionBase, "r" | "s" | "v"> & {
  readonly [field: string]: unknown;
  r?: Hex | undefined;
  s?: Hex | undefined;
  type: UnknownTransactionType;
  v?: Quantity | undefined;
};

export type RpcTransaction =
  | RpcTransactionLegacy
  | RpcTransactionEip2930
  | RpcTransactionEip1559
  | RpcTransactionEip4844
  | RpcTransactionEip7702
  | RpcTransactionOpDeposit
  | RpcTransactionUnknown;

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
  baseFeePerGas?: Quantity | undefined;
  /** Blob gas consumed by EIP-4844 transactions in this block. */
  blobGasUsed?: Quantity | undefined;
  /** Legacy proof-of-work difficulty. */
  difficulty: Quantity;
  /** Excess blob gas used to calculate this block's blob base fee. */
  excessBlobGas?: Quantity | undefined;
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
  parentBeaconBlockRoot?: Hash | undefined;
  /** Hash of the parent execution block. */
  parentHash: Hash;
  /** Root of the transaction receipts trie. */
  receiptsRoot: Hash;
  /** Root of execution requests introduced by EIP-7685, when supported. */
  requestsHash?: Hash | undefined;
  /** Additional consensus-engine seal fields returned by some clients. */
  sealFields?: readonly Hex[] | undefined;
  /** Keccak hash of the encoded uncle list. */
  sha3Uncles: Hash;
  /** Encoded block size in bytes. */
  size: Quantity;
  /** Root of the post-execution state trie. */
  stateRoot: Hash;
  /** Unix timestamp at which the block was produced. */
  timestamp: Quantity;
  /** Cumulative proof-of-work difficulty, absent on some post-merge nodes. */
  totalDifficulty?: Quantity | undefined;
  /** Transaction hashes or complete objects according to the request flag. */
  transactions: includeTransactions extends true ? readonly RpcTransaction[] : readonly Hash[];
  /** Root of the transactions trie. */
  transactionsRoot: Hash;
  /** Hashes of uncle blocks included by this block. */
  uncles: readonly Hash[];
  /** Arbitrum only: L1 block number seen by the sequencer when this block was produced. */
  l1BlockNumber?: Quantity | undefined;
  /** Arbitrum only: number of L2-to-L1 messages sent so far. */
  sendCount?: Quantity | undefined;
  /** Arbitrum only: Merkle root of the L2-to-L1 outbox. */
  sendRoot?: Hash | undefined;
  /** Validator withdrawals, when supported by the fork. */
  withdrawals?: readonly Withdrawal[] | undefined;
  /** Root of the withdrawals trie, when supported by the fork. */
  withdrawalsRoot?: Hash | undefined;
};

export type RpcLog = {
  /** Contract that emitted the log. */
  address: Address;
  /** Hash of the containing block, or null for a pending log. */
  blockHash: Hash | null;
  /** Number of the containing block, or null for a pending log. */
  blockNumber: Quantity | null;
  /** Timestamp of the containing block when supplied by the node. */
  blockTimestamp?: Quantity | undefined;
  /** Non-indexed event data. */
  data: Hex;
  /** Position within the block, or null for a pending log. */
  logIndex: Index | null;
  /** Whether the log was removed by a chain reorganization. */
  removed: boolean;
  /** Indexed event values; the first item is usually the event signature. */
  topics: readonly Hex[];
  /** Emitting transaction hash, or null for a pending log. */
  transactionHash: Hash | null;
  /** Transaction position in the block, or null for a pending log. */
  transactionIndex: Index | null;
};

/** Transaction execution status: `0x0` for failure or `0x1` for success. */
export type RpcReceiptStatus = "0x0" | "0x1";

/** Transaction type identifiers, including chain-specific ones this package does not model. */
export type RpcTransactionType = RpcTransaction["type"];

export type RpcTransactionReceipt = {
  /** Blob gas price paid, in wei, for an EIP-4844 transaction. */
  blobGasPrice?: Quantity | undefined;
  /** Blob gas consumed by an EIP-4844 transaction. */
  blobGasUsed?: Quantity | undefined;
  /** Hash of the block containing the transaction. */
  blockHash: Hash;
  /** Number of the block containing the transaction. */
  blockNumber: Quantity;
  /** Timestamp of the containing block when supplied by the node. */
  blockTimestamp?: Quantity | undefined;
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
  logs: readonly RpcLog[];
  /** Bloom filter covering the transaction logs. */
  logsBloom: Hex;
  /** Post-transaction state root, present on pre-Byzantium receipts. */
  root?: Hash | undefined;
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
  /** OP Stack only: nonce of the deposit sender, for deposit transactions. */
  depositNonce?: Quantity | undefined;
  /** OP Stack only: version of the deposit receipt format. */
  depositReceiptVersion?: Quantity | undefined;
  /** OP Stack only: scalar applied to the L1 base fee (Ecotone and later). */
  l1BaseFeeScalar?: Quantity | undefined;
  /** OP Stack only: L1 blob base fee used for the data fee (Ecotone and later). */
  l1BlobBaseFee?: Quantity | undefined;
  /** OP Stack only: scalar applied to the L1 blob base fee (Ecotone and later). */
  l1BlobBaseFeeScalar?: Quantity | undefined;
  /** OP Stack only: L1 data fee paid by the transaction, in wei. */
  l1Fee?: Quantity | undefined;
  /** OP Stack only: fee scalar as a decimal string (before Ecotone). */
  l1FeeScalar?: string | undefined;
  /** OP Stack only: L1 gas price used for the data fee. */
  l1GasPrice?: Quantity | undefined;
  /** OP Stack only: L1 gas attributed to the transaction data. */
  l1GasUsed?: Quantity | undefined;
  /** OP Stack only: operator fee constant (Isthmus and later). */
  operatorFeeConstant?: Quantity | undefined;
  /** OP Stack only: operator fee scalar (Isthmus and later). */
  operatorFeeScalar?: Quantity | undefined;
  /** Arbitrum only: portion of `gasUsed` paying for L1 calldata. */
  gasUsedForL1?: Quantity | undefined;
  /** Arbitrum only: L1 block number seen by the sequencer. */
  l1BlockNumber?: Quantity | undefined;
};

export type RpcAccessListResult = {
  /** Access list generated for the simulated transaction. */
  accessList: AccessList;
  /** Error encountered while constructing the access list, when any. */
  error?: string | undefined;
  /** Estimated gas consumed with the generated access list. */
  gasUsed: Quantity;
};

export type RpcFeeHistory = {
  /** Base fee per blob gas, including the next block when supported. */
  baseFeePerBlobGas?: readonly Quantity[] | undefined;
  /** Base fee per gas, including the next block. */
  baseFeePerGas: readonly Quantity[];
  /** Blob gas utilization ratios for returned blocks. */
  blobGasUsedRatio?: readonly number[] | undefined;
  /** Gas utilization ratios for returned blocks. */
  gasUsedRatio: readonly number[];
  /** Number of the oldest returned block. */
  oldestBlock: BlockNumber;
  /** Priority-fee samples for each requested percentile. */
  reward?: readonly Quantity[][] | undefined;
};

export type RpcStorageProof = {
  /** Merkle proof nodes for this storage slot. */
  proof: readonly Hex[];
  /** Requested storage key. */
  key: Hex;
  /** Value stored at the requested key. */
  value: Quantity;
};

export type RpcAccountProof = {
  /** Account Merkle proof nodes. */
  accountProof: readonly Hex[];
  /** Account balance in wei. */
  balance: Quantity;
  /** Hash of the account bytecode. */
  codeHash: Hash;
  /** Account nonce. */
  nonce: Quantity;
  /** Root of the account storage trie. */
  storageHash: Hash;
  /** Proofs for each requested storage key. */
  storageProof: readonly RpcStorageProof[];
};

/** Topic selectors, including OR lists and null wildcards by position. */
export type LogTopics = readonly (Hex | readonly Hex[] | null)[];

export type LogsByHashFilter = {
  /** Contract address or addresses from which logs must originate. */
  address?: Address | readonly Address[] | undefined;
  /** Exact block whose logs should be returned. */
  blockHash: BlockHash;
  /** Positional topic selectors. */
  topics?: LogTopics | undefined;
};

export type LogsByRangeFilter = {
  /** Contract address or addresses from which logs must originate. */
  address?: Address | readonly Address[] | undefined;
  /** Inclusive first block; defaults are provider-specific. */
  fromBlock?: BlockNumberOrTag | undefined;
  /** Inclusive final block; defaults are provider-specific. */
  toBlock?: BlockNumberOrTag | undefined;
  /** Positional topic selectors. */
  topics?: LogTopics | undefined;
};

/** Log filters accepted by an `eth_subscribe` logs subscription. */
export type LogsSubscriptionFilter = Pick<LogsByRangeFilter, "address" | "topics">;

/** Account fields replaced before simulated execution. */
export type AccountOverride = {
  /** Replacement balance in wei. */
  balance?: Quantity | undefined;
  /** Replacement nonce. */
  nonce?: Quantity | undefined;
  /** Replacement runtime bytecode. */
  code?: Hex | undefined;
  /** Complete storage replacement. Exclusive with `stateDiff`. */
  state?: { readonly [slot: Hex]: Hex } | undefined;
  /** Storage slots patched on top of the existing storage. Exclusive with `state`. */
  stateDiff?: { readonly [slot: Hex]: Hex } | undefined;
  /** Moves the precompile at this account to another address. */
  movePrecompileToAddress?: Address | undefined;
};

/** Per-account state replacements keyed by address. */
export type StateOverride = { readonly [address: Address]: AccountOverride };

/** Header fields replaced for a simulated block. */
export type BlockOverrides = {
  baseFeePerGas?: Quantity | undefined;
  blobBaseFee?: Quantity | undefined;
  feeRecipient?: Address | undefined;
  gasLimit?: Quantity | undefined;
  number?: Quantity | undefined;
  prevRandao?: Hash | undefined;
  time?: Quantity | undefined;
  withdrawals?: readonly Withdrawal[] | undefined;
};

/** Input of `eth_simulateV1`: blocks simulated in order on top of the base block. */
export type EthSimulatePayload = {
  blockStateCalls: readonly {
    blockOverrides?: BlockOverrides | undefined;
    calls?: readonly RpcCallRequest[] | undefined;
    stateOverrides?: StateOverride | undefined;
  }[];
  /** Return full transaction objects instead of hashes. */
  returnFullTransactions?: boolean | undefined;
  /** Report native ETH transfers as synthetic logs. */
  traceTransfers?: boolean | undefined;
  /** Enforce nonce, balance, and fee checks like a real block. */
  validation?: boolean | undefined;
};

/** Result of one call executed by `eth_simulateV1`. */
export type RpcSimulatedCall = {
  /** Present when the call reverted or failed. */
  error?: { code: number; data?: Hex; message: string } | undefined;
  gasUsed: Quantity;
  logs: readonly RpcLog[];
  returnData: Hex;
  status: RpcReceiptStatus;
};

/** Block produced by `eth_simulateV1`, with the result of each call. */
export type RpcSimulatedBlock = RpcBlock & { calls: readonly RpcSimulatedCall[] };
