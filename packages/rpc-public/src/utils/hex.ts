import type { Hex, Quantity } from "../types/primitives.js";

const HEX = /^0x[0-9a-fA-F]*$/;
const QUANTITY = /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/;

/** Whether `value` is `0x` followed by hexadecimal digits (possibly none). */
export function isHex(value: unknown): value is Hex {
  return typeof value === "string" && HEX.test(value);
}

/** Whether `value` is a canonical JSON-RPC quantity: no leading zeros, `0x0` for zero. */
export function isQuantity(value: unknown): value is Quantity {
  return typeof value === "string" && QUANTITY.test(value);
}

/** Converts hex data or a quantity to a `bigint`. `0x` is zero. */
export function hexToBigInt(value: Hex): bigint {
  if (!isHex(value)) throw new TypeError(`Invalid hex value: ${String(value)}`);
  return value === "0x" ? 0n : BigInt(value);
}

/** Converts hex to a `number`, rejecting values above `Number.MAX_SAFE_INTEGER`. */
export function hexToNumber(value: Hex): number {
  const result = hexToBigInt(value);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`${value} exceeds Number.MAX_SAFE_INTEGER; use hexToBigInt.`);
  }
  return Number(result);
}

/** Encodes a non-negative integer as a canonical JSON-RPC quantity, such as a block number. */
export function toQuantity(value: bigint | number): Quantity {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new RangeError(`${value} is not a safe integer.`);
  }
  if (value < 0) throw new RangeError(`${value} is negative.`);
  return `0x${value.toString(16)}`;
}

/** Decodes hex data into bytes. The digit count must be even. */
export function hexToBytes(value: Hex): Uint8Array {
  if (!isHex(value)) throw new TypeError(`Invalid hex value: ${String(value)}`);
  const digits = value.slice(2);
  if (digits.length % 2 !== 0) throw new TypeError(`Hex data has an odd length: ${value}`);
  const bytes = new Uint8Array(digits.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(digits.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/** Encodes bytes as lowercase hex data. */
export function bytesToHex(bytes: Uint8Array): Hex {
  let hex = "0x";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex as Hex;
}
