import type { BlockHash, HttpClient, HttpRequestOptions } from "@purevm/public";

import type { BlockResult } from "../types.js";
import { formatBlock } from "./format-block.js";

export async function getBlockByHash(
  client: HttpClient,
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<BlockResult> {
  const response = await client.ethGetBlockByHash(
    { blockHash, includeTransactions: true },
    options,
  );
  return formatBlock(response, `hash ${blockHash}`);
}
