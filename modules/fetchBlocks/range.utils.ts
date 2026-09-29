import type { BlockNumber } from "@purevm/rpc-public";

import { FetchBlocksDataError } from "./FetchBlocksDataError.js";

export function assertBlockRange(fromBlock: bigint, toBlock: bigint): void {
  if (fromBlock < 0n) throw new FetchBlocksDataError("fromBlock must be non-negative");
  if (fromBlock > toBlock) {
    throw new FetchBlocksDataError("fromBlock must be lower than or equal to toBlock");
  }
}

export function blockNumbers(fromBlock: bigint, toBlock: bigint): bigint[] {
  const numbers: bigint[] = [];
  for (let current: bigint = fromBlock; current <= toBlock; current++) numbers.push(current);
  return numbers;
}

export function toBlockNumber(value: bigint): BlockNumber {
  return `0x${value.toString(16)}`;
}

export function parseQuantity(value: string, label: string): bigint {
  if (!/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value)) {
    throw new FetchBlocksDataError(`${label} is not a valid hex quantity: ${value}`);
  }
  return BigInt(value);
}

export function toSafeIndex(value: string, label: string): number {
  const index = Number(parseQuantity(value, label));
  if (!Number.isSafeInteger(index)) {
    throw new FetchBlocksDataError(`${label} exceeds the safe integer range: ${value}`);
  }
  return index;
}
