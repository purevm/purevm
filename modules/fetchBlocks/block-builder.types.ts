import type { BlockHash, TraceRewardEntry } from "@purevm/public";

import type { BlockData, FetchedTransaction } from "./types.js";

export type BlockBuilder = {
  block: BlockData;
  blockHash: BlockHash;
  blockNumber: bigint;
  logIndexes: Set<bigint>;
  rewards: TraceRewardEntry[];
  transactionByIndex: Map<number, FetchedTransaction>;
  transactions: FetchedTransaction[];
};
