import type { RpcTransactionReceipt } from "@purevm/rpc-public";

import { ExtensionDataError } from "../errors/index.js";
import type { ReceiptsResult } from "../types.js";
import { mapByTransactionHash } from "../utils/map-by-transaction-hash.js";

export function formatReceipts(
  response: readonly RpcTransactionReceipt[] | null,
  selector: string,
): ReceiptsResult {
  if (!response) throw new ExtensionDataError(`Block receipts not found for ${selector}`);

  return {
    receipts: mapByTransactionHash(response, (receipt) => receipt.transactionHash, "Receipts"),
  };
}
