import type { RpcLog } from "@purevm/public";

import type { BlockBuilder } from "./block-builder.types.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { sameHash } from "./hash.utils.js";
import { parseQuantity, toSafeIndex } from "./range.utils.js";

export function attachLog(log: RpcLog, builders: ReadonlyMap<bigint, BlockBuilder>): void {
  if (!log.blockNumber) throw new FetchBlocksDataError("Range log has no block number");
  const blockNumber = parseQuantity(log.blockNumber, "Log block number");
  const builder = builders.get(blockNumber);
  if (!builder) throw new FetchBlocksDataError(`Log belongs to unexpected block ${blockNumber}`);
  if (!sameHash(log.blockHash, builder.blockHash)) {
    throw new FetchBlocksDataError(`Log block hash mismatch for block ${blockNumber}`);
  }
  if (log.removed) throw new FetchBlocksDataError(`Removed log returned for block ${blockNumber}`);
  if (!log.transactionIndex) {
    throw new FetchBlocksDataError(`Log in block ${blockNumber} has no transaction index`);
  }

  const transactionIndex = toSafeIndex(log.transactionIndex, "Log transaction index");
  const transaction = builder.transactionByIndex.get(transactionIndex);
  if (!transaction) {
    throw new FetchBlocksDataError(
      `Log transaction index ${transactionIndex} is absent from block ${blockNumber}`,
    );
  }
  if (!sameHash(log.transactionHash, transaction.transactionHash)) {
    throw new FetchBlocksDataError(
      `Log transaction hash mismatch at block ${blockNumber} index ${transactionIndex}`,
    );
  }
  if (!log.logIndex) throw new FetchBlocksDataError(`Log in block ${blockNumber} has no index`);
  const logIndex = parseQuantity(log.logIndex, "Log index");
  if (builder.logIndexes.has(logIndex)) {
    throw new FetchBlocksDataError(`Duplicate log index ${logIndex} in block ${blockNumber}`);
  }

  builder.logIndexes.add(logIndex);
  transaction.logs.push(log);
}
