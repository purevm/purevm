import type { TraceEntry } from "@purevm/public";

import type { FetchContext } from "./fetch-context.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { assertPositiveSafeInteger } from "./number.utils.js";
import { isRangeTooLargeError } from "./range-errors.js";
import { toBlockNumber } from "./range.utils.js";

/**
 * Fetches every trace of an inclusive block range with paginated `trace_filter`. A range is split
 * in half when the provider rejects it as too large. Any other failure is rethrown unchanged.
 */
export async function fetchTracesRange(
  context: FetchContext,
  fromBlock: bigint,
  toBlock: bigint,
  pageSize: number,
): Promise<readonly TraceEntry[]> {
  assertPositiveSafeInteger(pageSize, "tracePageSize");
  return fetchTracesSplit(context, fromBlock, toBlock, pageSize);
}

async function fetchTracesSplit(
  context: FetchContext,
  fromBlock: bigint,
  toBlock: bigint,
  pageSize: number,
): Promise<readonly TraceEntry[]> {
  try {
    return await fetchTracePages(context, fromBlock, toBlock, pageSize);
  } catch (cause) {
    if (!isRangeTooLargeError(cause)) throw cause;
    if (fromBlock === toBlock) {
      throw new FetchBlocksDataError(`trace_filter rejected block ${fromBlock} as too large`, {
        cause,
      });
    }
    const middle = (fromBlock + toBlock) / 2n;
    const [left, right] = await Promise.all([
      fetchTracesSplit(context, fromBlock, middle, pageSize),
      fetchTracesSplit(context, middle + 1n, toBlock, pageSize),
    ]);
    return [...left, ...right];
  }
}

/**
 * Pages until an empty page. A short page is not treated as the last one, because providers may
 * cap `count` below `pageSize` without saying so.
 */
async function fetchTracePages(
  context: FetchContext,
  fromBlock: bigint,
  toBlock: bigint,
  pageSize: number,
): Promise<readonly TraceEntry[]> {
  const traces: TraceEntry[] = [];
  let previousFirst: string | undefined;

  for (;;) {
    const page = await context.limit(() =>
      context.client.traceFilter(
        {
          after: traces.length,
          count: pageSize,
          fromBlock: toBlockNumber(fromBlock),
          toBlock: toBlockNumber(toBlock),
        },
        context.requestOptions,
      ),
    );
    const first = page[0];
    if (!first) return traces;

    const firstKey = traceKey(first);
    if (firstKey === previousFirst) {
      throw new FetchBlocksDataError(
        `trace_filter ignored the "after" offset for blocks ${fromBlock}-${toBlock}`,
      );
    }
    previousFirst = firstKey;
    for (const trace of page) traces.push(trace);
  }
}

function traceKey(trace: TraceEntry): string {
  const transaction = trace.type === "reward" ? "reward" : trace.transactionHash;
  return `${trace.blockHash}:${transaction}:${trace.traceAddress.join(".")}`;
}
