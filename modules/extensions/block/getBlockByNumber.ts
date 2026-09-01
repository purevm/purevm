import type { BlockNumber, HttpClient, HttpRequestOptions } from "@purevm/rpc";

import type { BlockResult } from "../types.js";
import { formatBlock } from "./format-block.js";

export async function getBlockByNumber(
  client: HttpClient,
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<BlockResult> {
  const response = await client.ethGetBlockByNumber(
    { blockNumber, includeTransactions: true },
    options,
  );
  return formatBlock(response, `number ${blockNumber}`);
}
