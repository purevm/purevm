/* Hexadecimal sizing and byte conversions used by the decoder. */
import type { Hex } from "./abi.types.ts";
import { InvalidByteSequenceError } from "./errors.encoding.ts";

/**
 * Size in bytes. `data` is typed as hex but not checked: like viem, a string without `0x` counts
 * its characters.
 */
export function size(value: Hex): number {
  if (value.startsWith("0x")) {
    return Math.ceil((value.length - 2) / 2);
  }
  return value.length;
}

const BYTE_TO_HEX = /*#__PURE__*/ Array.from({ length: 256 }, (_value, byte) =>
  byte.toString(16).padStart(2, "0"),
);

/** Lowercase hex. */
export function bytesToHex(value: Uint8Array): Hex {
  let string = "";
  for (const byte of value) {
    string += BYTE_TO_HEX[byte] ?? byte.toString(16).padStart(2, "0");
  }
  return `0x${string}`;
}

/** ASCII bounds used by the allocation-free hexadecimal parser. */
const CHAR_CODE = {
  zero: 48,
  nine: 57,
  A: 65,
  F: 70,
  a: 97,
  f: 102,
} as const;

function charCodeToBase16(char: number) {
  if (char >= CHAR_CODE.zero && char <= CHAR_CODE.nine) {
    return char - CHAR_CODE.zero;
  }
  if (char >= CHAR_CODE.A && char <= CHAR_CODE.F) {
    return char - (CHAR_CODE.A - 10);
  }
  if (char >= CHAR_CODE.a && char <= CHAR_CODE.f) {
    return char - (CHAR_CODE.a - 10);
  }
  return undefined;
}

/** Validates canonical whole-byte hex while converting it. */
export function strictHexToBytes(value: string): Uint8Array | undefined {
  if (!value.startsWith("0x") || value.length % 2 !== 0) {
    return undefined;
  }
  const length = (value.length - 2) / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, offset = 2; index < length; index++) {
    const nibbleLeft = charCodeToBase16(value.charCodeAt(offset++));
    const nibbleRight = charCodeToBase16(value.charCodeAt(offset++));
    if (nibbleLeft === undefined || nibbleRight === undefined) {
      return undefined;
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}

/**
 * Drops the first two characters (the `0x`, unchecked) and left-pads an odd number of digits with
 * a `0`. Throws on any character that is not a hex digit.
 */
export function hexToBytes(hex: Hex): Uint8Array {
  let hexString = hex.slice(2) as string;
  if (hexString.length % 2) {
    hexString = `0${hexString}`;
  }

  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === undefined || nibbleRight === undefined) {
      throw new InvalidByteSequenceError({
        sequence: hexString.slice(j - 2, j),
        value: hexString,
      });
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}
