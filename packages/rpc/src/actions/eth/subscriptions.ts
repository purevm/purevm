import type { Quantity } from "../../types/primitives.js";
import type { RpcBlock, RpcLog, RpcTransaction } from "./types.js";

export type RpcSyncingStatus = {
  currentBlock: Quantity;
  highestBlock: Quantity;
  startingBlock: Quantity;
};

export type NewHeadsSubscriptionResult = Omit<
  RpcBlock<false>,
  "size" | "totalDifficulty" | "transactions"
>;
export type LogsSubscriptionResult = RpcLog;
export type SyncingSubscriptionResult = boolean | RpcSyncingStatus;
export type PendingTransactionSubscriptionResult<fullTransactions extends boolean> =
  fullTransactions extends true ? RpcTransaction : `0x${string}`;
