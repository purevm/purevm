import type { BlockBuilder } from "./block-builder.types.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { parseQuantity } from "./range.utils.js";
import {
  assertCompleteTraceTree,
  assertUniqueTracePaths,
  compareTracePath,
} from "./trace.utils.js";
import type { FetchedBlock } from "./types.js";

export function finalizeBlock(builder: BlockBuilder): FetchedBlock {
  for (const transaction of builder.transactions) {
    transaction.logs.sort(
      (left, right) =>
        Number(parseQuantity(left.logIndex as string, "Log index")) -
        Number(parseQuantity(right.logIndex as string, "Log index")),
    );
    transaction.traces.sort(compareTracePath);
    assertUniqueTracePaths(builder.blockNumber, transaction);
    if (transaction.traces.length === 0) {
      throw new FetchBlocksDataError(
        `Transaction ${transaction.transactionHash} in block ${builder.blockNumber} has no trace`,
      );
    }
    assertCompleteTraceTree(builder.blockNumber, transaction);
    // Sorted by path, so the root trace comes first.
    const root = transaction.traces[0];
    transaction.error = root?.error ?? null;
    transaction.status = transaction.error === null ? "success" : "reverted";
  }
  builder.rewards.sort(compareTracePath);

  return {
    block: builder.block,
    blockHash: builder.blockHash,
    blockNumber: builder.blockNumber,
    rewards: builder.rewards,
    transactions: builder.transactions,
  };
}
