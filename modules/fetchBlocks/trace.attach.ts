import type { TraceEntry } from "@purevm/public";

import type { BlockBuilder } from "./block-builder.types.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { sameHash } from "./hash.utils.js";

export function attachTrace(trace: TraceEntry, builders: ReadonlyMap<bigint, BlockBuilder>): void {
  if (!Number.isSafeInteger(trace.blockNumber) || trace.blockNumber < 0) {
    throw new FetchBlocksDataError(`Invalid trace block number ${trace.blockNumber}`);
  }
  const blockNumber = BigInt(trace.blockNumber);
  const builder = builders.get(blockNumber);
  if (!builder) throw new FetchBlocksDataError(`Trace belongs to unexpected block ${blockNumber}`);
  if (!sameHash(trace.blockHash, builder.blockHash)) {
    throw new FetchBlocksDataError(`Trace block hash mismatch for block ${blockNumber}`);
  }

  if (trace.type === "reward") {
    builder.rewards.push(trace);
    return;
  }

  if (!Number.isSafeInteger(trace.transactionPosition) || trace.transactionPosition < 0) {
    throw new FetchBlocksDataError(
      `Invalid trace transaction position ${trace.transactionPosition} in block ${blockNumber}`,
    );
  }
  const transaction = builder.transactionByIndex.get(trace.transactionPosition);
  if (!transaction) {
    throw new FetchBlocksDataError(
      `Trace transaction index ${trace.transactionPosition} is absent from block ${blockNumber}`,
    );
  }
  if (!sameHash(trace.transactionHash, transaction.transactionHash)) {
    throw new FetchBlocksDataError(
      `Trace transaction hash mismatch at block ${blockNumber} index ${trace.transactionPosition}`,
    );
  }
  transaction.traces.push(trace);
}
