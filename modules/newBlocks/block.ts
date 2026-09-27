import type { BlockHash, BlockNumber, Quantity } from "@purevm/public";

import type { BlockHeader, RpcBlockHeader, RpcLatestBlock } from "./types.js";

export function parseBlockHeader(
  value: RpcBlockHeader | RpcLatestBlock,
  receivedAt = Date.now(),
): BlockHeader {
  if (!isQuantity(value.number)) throw new Error("Block header has an invalid number");
  if (!isBlockHash(value.hash)) throw new Error("Block header has an invalid hash");
  if (!isBlockHash(value.parentHash)) throw new Error("Block header has an invalid parent hash");
  if (!isQuantity(value.timestamp)) throw new Error("Block header has an invalid timestamp");

  return {
    hash: value.hash.toLowerCase() as BlockHash,
    number: BigInt(value.number),
    numberHex: value.number.toLowerCase() as BlockNumber,
    parentHash: value.parentHash.toLowerCase() as BlockHash,
    receivedAt,
    timestamp: BigInt(value.timestamp),
    timestampHex: value.timestamp.toLowerCase() as Quantity,
  };
}

function isQuantity(value: unknown): value is Quantity {
  return typeof value === "string" && /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value);
}

function isBlockHash(value: unknown): value is BlockHash {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}
