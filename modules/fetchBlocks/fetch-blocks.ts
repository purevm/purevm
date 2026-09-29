import type { HttpClient } from "@purevm/rpc-public";

import { assembleBlocks } from "./assemble-blocks.js";
import { fetchBlocksByNumber } from "./block.request.js";
import type { FetchContext } from "./fetch-context.js";
import { createLimiter } from "./limiter.js";
import { fetchLogsRange } from "./logs.request.js";
import { assertPositiveSafeInteger } from "./number.utils.js";
import { assertBlockRange, blockNumbers } from "./range.utils.js";
import { fetchTracesRange } from "./traces.request.js";
import type { FetchBlocksOptions, FetchBlocksResult } from "./types.js";

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_MAX_LOGS_PER_REQUEST = 10_000;
const DEFAULT_TRACE_PAGE_SIZE = 10_000;

/**
 * Fetches a block range with full transactions, logs, and traces: one `eth_getBlockByNumber` per
 * block, `eth_getLogs` and paginated `trace_filter` over the whole range. The first request that
 * fails for good aborts every other one.
 */
export async function fetchBlocks(
  client: HttpClient,
  options: FetchBlocksOptions,
): Promise<FetchBlocksResult> {
  const { fromBlock, requestOptions, toBlock } = options;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  assertBlockRange(fromBlock, toBlock);
  assertPositiveSafeInteger(concurrency, "concurrency");

  const controller = new AbortController();
  const signal = requestOptions?.signal
    ? AbortSignal.any([requestOptions.signal, controller.signal])
    : controller.signal;
  const limiter = createLimiter(concurrency);
  const context: FetchContext = {
    client,
    // Queued requests are dropped once the operation is aborted.
    limit: (task) =>
      limiter(() => {
        signal.throwIfAborted();
        return task();
      }),
    requestOptions: { ...requestOptions, signal },
  };
  const abortOnFailure = <result>(promise: Promise<result>): Promise<result> =>
    promise.catch((error: unknown) => {
      controller.abort(error);
      throw error;
    });

  const numbers = blockNumbers(fromBlock, toBlock);
  // Range requests are queued first: they are the slowest, and one block request per height would
  // otherwise take every slot before them.
  const [logs, traces, blocks] = await Promise.all([
    abortOnFailure(
      fetchLogsRange(
        context,
        fromBlock,
        toBlock,
        options.maxLogsPerRequest ?? DEFAULT_MAX_LOGS_PER_REQUEST,
      ),
    ),
    abortOnFailure(
      fetchTracesRange(
        context,
        fromBlock,
        toBlock,
        options.tracePageSize ?? DEFAULT_TRACE_PAGE_SIZE,
      ),
    ),
    abortOnFailure(fetchBlocksByNumber(context, numbers)),
  ]);

  return assembleBlocks(blocks, numbers, logs, traces);
}
