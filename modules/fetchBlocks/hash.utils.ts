import type { BlockHash, Hash, TransactionHash } from "@purevm/rpc-public";

import { FetchBlocksDataError } from "./FetchBlocksDataError.js";

export function normalizeBlockHash(value: Hash | null, label: string): BlockHash {
  return normalizeHash(value, label) as BlockHash;
}

export function normalizeTransactionHash(value: Hash, label: string): TransactionHash {
  return normalizeHash(value, label) as TransactionHash;
}

export function sameHash(left: string | null, right: string): boolean {
  return left?.toLowerCase() === right.toLowerCase();
}

function normalizeHash(value: Hash | null, label: string): Hash {
  if (!value || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new FetchBlocksDataError(`${label} is not a 32-byte hash: ${value}`);
  }
  return value.toLowerCase() as Hash;
}
