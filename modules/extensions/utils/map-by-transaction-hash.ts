import type { TransactionHash } from "@purevm/public";

import { ExtensionDataError } from "../errors/index.js";
import { normalizeHash } from "./hash.js";

export function mapByTransactionHash<value>(
  values: readonly value[],
  getHash: (value: value) => TransactionHash,
  label: string,
): Record<TransactionHash, value> {
  const result: Record<TransactionHash, value> = {};

  for (const value of values) {
    const hash = normalizeHash(getHash(value), `${label} transaction hash`);
    if (Object.hasOwn(result, hash)) {
      throw new ExtensionDataError(`${label} contains duplicate transaction hash ${hash}`);
    }
    result[hash] = value;
  }

  return result;
}
