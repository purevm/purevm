import type { RpcBlock } from "@purevm/rpc-public";

import type { FetchContext } from "./fetch-context.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { toBlockNumber } from "./range.utils.js";

/** Fetches every full block of `numbers` in order, one `eth_getBlockByNumber` each. */
export async function fetchBlocksByNumber(
  context: FetchContext,
  numbers: readonly bigint[],
): Promise<readonly RpcBlock<true>[]> {
  return Promise.all(
    numbers.map(async (number) => {
      const block = await context.limit(() =>
        context.client.ethGetBlockByNumber(
          { blockNumber: toBlockNumber(number), includeTransactions: true },
          context.requestOptions,
        ),
      );
      if (!block) throw new FetchBlocksDataError(`Block ${number} was not found`);
      return block;
    }),
  );
}
