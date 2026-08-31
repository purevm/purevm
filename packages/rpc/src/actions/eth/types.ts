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
  address: Address;
  storageKeys: readonly Hex[];
}[];

export type RpcAuthorization = {
  address: Address;
  chainId: Quantity;
  nonce: Quantity;
  r: Hex;
  s: Hex;
  yParity: Quantity;
};

export type RpcTransactionBase = {
  blockHash: Hash | null;
  blockNumber: Quantity | null;
  blockTimestamp?: Quantity;
  from: Address;
  gas: Quantity;
  hash: Hash;
  input: Hex;
  nonce: Quantity;
  r: Hex;
  s: Hex;
  to: Address | null;
  transactionIndex: Index | null;
  v: Quantity;
  value: Quantity;
};

export type RpcTransactionLegacy = RpcTransactionBase & {
  chainId?: Quantity;
  gasPrice: Quantity;
  type: "0x0";
};

export type RpcTransactionEip2930 = RpcTransactionBase & {
  accessList: AccessList;
  chainId: Quantity;
  gasPrice: Quantity;
  type: "0x1";
  yParity?: Quantity;
};

export type RpcTransactionEip1559 = RpcTransactionBase & {
  accessList: AccessList;
  chainId: Quantity;
  maxFeePerGas: Quantity;
  maxPriorityFeePerGas: Quantity;
  type: "0x2";
  yParity?: Quantity;
};

export type RpcTransactionEip4844 = RpcTransactionBase & {
  accessList: AccessList;
  blobVersionedHashes: readonly Hex[];
  chainId: Quantity;
  maxFeePerBlobGas: Quantity;
  maxFeePerGas: Quantity;
  maxPriorityFeePerGas: Quantity;
  type: "0x3";
  yParity?: Quantity;
};

export type RpcTransactionEip7702 = RpcTransactionBase & {
  accessList: AccessList;
  authorizationList?: readonly RpcAuthorization[];
  chainId: Quantity;
  maxFeePerGas: Quantity;
  maxPriorityFeePerGas: Quantity;
  type: "0x4";
  yParity?: Quantity;
};

export type RpcTransaction =
  | RpcTransactionLegacy
  | RpcTransactionEip2930
  | RpcTransactionEip1559
  | RpcTransactionEip4844
  | RpcTransactionEip7702;

export type Withdrawal = {
  address: Address;
  amount: Quantity;
  index: Index;
  validatorIndex: Index;
};

export type RpcBlock<includeTransactions extends boolean = boolean> = {
  baseFeePerGas?: Quantity;
  blobGasUsed?: Quantity;
  difficulty: Quantity;
  excessBlobGas?: Quantity;
  extraData: Hex;
  gasLimit: Quantity;
  gasUsed: Quantity;
  hash: Hash | null;
  logsBloom: Hex | null;
  miner: Address;
  mixHash: Hash;
  nonce: Hex | null;
  number: Quantity | null;
  parentBeaconBlockRoot?: Hash;
  parentHash: Hash;
  receiptsRoot: Hash;
  requestsHash?: Hash;
  sha3Uncles: Hash;
  size: Quantity;
  stateRoot: Hash;
  timestamp: Quantity;
  totalDifficulty?: Quantity;
  transactions: includeTransactions extends true ? RpcTransaction[] : Hash[];
  transactionsRoot: Hash;
  uncles: Hash[];
  withdrawals?: Withdrawal[];
  withdrawalsRoot?: Hash;
};

export type RpcLog = {
  address: Address;
  blockHash: Hash | null;
  blockNumber: Quantity | null;
  blockTimestamp?: Quantity;
  data: Hex;
  logIndex: Index | null;
  removed: boolean;
  topics: Hex[];
  transactionHash: Hash | null;
  transactionIndex: Index | null;
};

export type RpcReceiptStatus = "0x0" | "0x1";

export type RpcTransactionReceipt = {
  blobGasPrice?: Quantity;
  blobGasUsed?: Quantity;
  blockHash: Hash;
  blockNumber: Quantity;
  blockTimestamp?: Quantity;
  contractAddress: Address | null;
  cumulativeGasUsed: Quantity;
  effectiveGasPrice: Quantity;
  from: Address;
  gasUsed: Quantity;
  logs: RpcLog[];
  logsBloom: Hex;
  root?: Hash;
  status: RpcReceiptStatus;
  to: Address | null;
  transactionHash: Hash;
  transactionIndex: Index;
  type: Quantity;
};

export type LogTopics = readonly (Hex | readonly Hex[] | null)[];

export type LogsByHashFilter = {
  address?: Address | readonly Address[];
  blockHash: BlockHash;
  topics?: LogTopics;
};

export type LogsByRangeFilter = {
  address?: Address | readonly Address[];
  fromBlock?: BlockNumberOrTag;
  toBlock?: BlockNumberOrTag;
  topics?: LogTopics;
};

export type LogsSubscriptionFilter = Pick<LogsByRangeFilter, "address" | "topics">;
