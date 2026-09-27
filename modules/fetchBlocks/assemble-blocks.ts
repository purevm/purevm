import type { RpcBlock, RpcLog, TraceEntry } from "@purevm/public";

import { createBlockBuilder } from "./block.builder.js";
import { finalizeBlock } from "./block.finalize.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { attachLog } from "./log.attach.js";
import { attachTrace } from "./trace.attach.js";
import type { FetchBlocksResult } from "./types.js";

export function assembleBlocks(
  responses: readonly RpcBlock<true>[],
  expectedNumbers: readonly bigint[],
  logs: readonly RpcLog[],
  traces: readonly TraceEntry[],
): FetchBlocksResult {
  if (responses.length !== expectedNumbers.length) {
    throw new FetchBlocksDataError(
      `Expected ${expectedNumbers.length} blocks, received ${responses.length}`,
    );
  }

  const builders = responses.map((response, index) => {
    const expectedNumber = expectedNumbers[index];
    if (expectedNumber === undefined) {
      throw new FetchBlocksDataError(`Missing expected block number at index ${index}`);
    }
    return createBlockBuilder(response, expectedNumber);
  });
  const byNumber = new Map(builders.map((builder) => [builder.blockNumber, builder]));

  for (const log of logs) attachLog(log, byNumber);
  for (const trace of traces) attachTrace(trace, byNumber);

  return { blocks: builders.map(finalizeBlock) };
}
