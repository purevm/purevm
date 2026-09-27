import type { BlockNumber, HttpClient, HttpRequestOptions } from "@purevm/public";

import type { ReceiptsResult } from "../types.js";
import { formatReceipts } from "./format-receipts.js";

export async function getBlockReceiptsByNumber(
  client: HttpClient,
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<ReceiptsResult> {
  return formatReceipts(
    await client.ethGetBlockReceiptsByNumber({ blockNumber }, options),
    `number ${blockNumber}`,
  );
}
