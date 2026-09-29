import type { RpcLog } from "@purevm/rpc-public";

import type { FetchContext } from "./fetch-context.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { assertPositiveSafeInteger } from "./number.utils.js";
import { isRangeTooLargeError } from "./range-errors.js";
import { toBlockNumber } from "./range.utils.js";

/**
 * Fetches every log of an inclusive block range. A range is split in half when the provider
 * rejects it as too large or when the response reaches `maxLogsPerRequest`, which may mean the
 * provider truncated it. Any other failure is rethrown unchanged.
 */
export async function fetchLogsRange(
  context: FetchContext,
  fromBlock: bigint,
  toBlock: bigint,
  maxLogsPerRequest: number,
): Promise<readonly RpcLog[]> {
  assertPositiveSafeInteger(maxLogsPerRequest, "maxLogsPerRequest");
  return fetchLogsSplit(context, fromBlock, toBlock, maxLogsPerRequest);
}

async function fetchLogsSplit(
  context: FetchContext,
  fromBlock: bigint,
  toBlock: bigint,
  maxLogsPerRequest: number,
): Promise<readonly RpcLog[]> {
  let logs: readonly RpcLog[];
  try {
    logs = await context.limit(() =>
      context.client.ethGetLogsByRange(
        { fromBlock: toBlockNumber(fromBlock), toBlock: toBlockNumber(toBlock) },
        context.requestOptions,
      ),
    );
  } catch (cause) {
    if (!isRangeTooLargeError(cause)) throw cause;
    if (fromBlock === toBlock) {
      throw new FetchBlocksDataError(`eth_getLogs rejected block ${fromBlock} as too large`, {
        cause,
      });
    }
    return fetchHalves(context, fromBlock, toBlock, maxLogsPerRequest);
  }

  if (logs.length < maxLogsPerRequest) return logs;
  if (fromBlock === toBlock) {
    throw new FetchBlocksDataError(
      `Block ${fromBlock} reached maxLogsPerRequest ${maxLogsPerRequest}; logs may be truncated`,
    );
  }
  return fetchHalves(context, fromBlock, toBlock, maxLogsPerRequest);
}

async function fetchHalves(
  context: FetchContext,
  fromBlock: bigint,
  toBlock: bigint,
  maxLogsPerRequest: number,
): Promise<readonly RpcLog[]> {
  const middle = (fromBlock + toBlock) / 2n;
  const [left, right] = await Promise.all([
    fetchLogsSplit(context, fromBlock, middle, maxLogsPerRequest),
    fetchLogsSplit(context, middle + 1n, toBlock, maxLogsPerRequest),
  ]);
  return [...left, ...right];
}
