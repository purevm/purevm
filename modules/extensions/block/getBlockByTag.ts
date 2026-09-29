import type { BlockTag, HttpClient, HttpRequestOptions } from "@purevm/rpc-public";

import type { BlockResult } from "../types.js";
import { formatBlock } from "./format-block.js";

export async function getBlockByTag(
  client: HttpClient,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<BlockResult> {
  const response = await client.ethGetBlockByTag({ blockTag, includeTransactions: true }, options);
  return formatBlock(response, `tag ${blockTag}`);
}
