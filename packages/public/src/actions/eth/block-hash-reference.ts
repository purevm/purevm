import type { BlockHash, BlockHashReference } from "../../types/primitives.js";

/** Builds an EIP-1898 selector, omitting `requireCanonical` when unset. */
export function toBlockHashReference(
  blockHash: BlockHash,
  requireCanonical: boolean | undefined,
): BlockHashReference {
  return requireCanonical === undefined ? { blockHash } : { blockHash, requireCanonical };
}
