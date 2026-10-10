import { IntegerOutOfRangeError, InvalidBytesBooleanError } from "../errors.viem.ts";

/** Converts big-endian bytes to a bigint without allocating an intermediate hex string. */
export function bytesToBigInt(
  bytes: Uint8Array,
  { signed }: { signed?: boolean | undefined } = {},
): bigint {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const remainder = bytes.length % 8;
  let value = 0n;
  let offset = 0;

  while (offset < remainder) {
    value = (value << 8n) | BigInt(view.getUint8(offset));
    offset++;
  }
  while (offset < bytes.length) {
    value = (value << 64n) | view.getBigUint64(offset);
    offset += 8;
  }
  if (!signed || bytes.length === 0) return value;

  const bitSize = BigInt(bytes.length * 8);
  const signBit = 1n << (bitSize - 1n);
  return (value & signBit) === 0n ? value : value - (1n << bitSize);
}

/** Converts big-endian bytes to a safe JavaScript number. */
export function bytesToNumber(
  bytes: Uint8Array,
  { signed }: { signed?: boolean | undefined } = {},
): number {
  const value = bytesToBigInt(bytes, { signed });
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw new IntegerOutOfRangeError(value);
  }
  return number;
}

/** Decodes viem's strict 32-byte boolean representation. */
export function bytesToBool(word: Uint8Array): boolean {
  let start = 0;
  while (start < word.length - 1 && word[start] === 0) {
    start++;
  }
  const value = word[start];
  if (word.length - start > 1 || (value !== undefined && value > 1)) {
    throw new InvalidBytesBooleanError(word.slice(start));
  }
  return Boolean(value);
}
