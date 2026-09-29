import type { RpcBlock } from "@purevm/rpc-public";

import { ExtensionDataError } from "../errors/index.js";
import type { BlockResult } from "../types.js";
import { mapByTransactionHash } from "../utils/map-by-transaction-hash.js";

export function formatBlock(response: RpcBlock<true> | null, selector: string): BlockResult {
  if (!response) throw new ExtensionDataError(`Block not found for ${selector}`);

  const { transactions: rawTransactions, ...block } = response;
  const transactions = mapByTransactionHash(
    rawTransactions,
    (transaction) => transaction.hash,
    "Block",
  );

  return { block, transactions };
}
