import type { BlockHash, HttpClient, HttpRequestOptions } from "@purevm/rpc-public";

import type { ReceiptsResult } from "../types.js";
import { formatReceipts } from "./format-receipts.js";

export async function getBlockReceiptsByHash(
  client: HttpClient,
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<ReceiptsResult> {
  return formatReceipts(
    await client.ethGetBlockReceiptsByHash({ blockHash }, options),
    `hash ${blockHash}`,
  );
}
