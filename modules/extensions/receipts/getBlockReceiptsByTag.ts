import type { BlockTag, HttpClient, HttpRequestOptions } from "@purevm/rpc";

import type { ReceiptsResult } from "../types.js";
import { formatReceipts } from "./format-receipts.js";

export async function getBlockReceiptsByTag(
  client: HttpClient,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<ReceiptsResult> {
  return formatReceipts(
    await client.ethGetBlockReceiptsByTag(blockTag, options),
    `tag ${blockTag}`,
  );
}
