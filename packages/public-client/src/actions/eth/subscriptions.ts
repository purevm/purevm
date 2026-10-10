import type { Quantity } from "../../types/primitives.js";
import type { RpcBlock, RpcLog, RpcTransaction } from "./types.js";

export type RpcSyncingStatus = {
  /** Block currently being downloaded or processed. */
  currentBlock: Quantity;
  /** Highest block known to the node. */
  highestBlock: Quantity;
  /** Block at which the current synchronization began. */
  startingBlock: Quantity;
};

/** Block header fields emitted by a `newHeads` subscription. */
export type NewHeadsSubscriptionResult = Omit<
  RpcBlock<false>,
  "size" | "totalDifficulty" | "transactions"
>;
/** Log emitted by a matching `logs` subscription. */
export type LogsSubscriptionResult = RpcLog;
/** False when synchronized, otherwise the node's synchronization progress. */
export type SyncingSubscriptionResult = boolean | RpcSyncingStatus;
/** Pending transaction hash or full transaction according to the subscription flag. */
export type PendingTransactionSubscriptionResult<fullTransactions extends boolean> =
  fullTransactions extends true ? RpcTransaction : `0x${string}`;
