/* Reader nodes for scalar ABI values and their canonical padding. */
import type { Cursor } from "./abi.cursor.ts";
import { ceil32, closeTail, readOffset, safeAddSize, type Node } from "./abi.nodes.ts";
import type { AddressFormat } from "./abi.types.ts";
import { DirtyPaddingError } from "./errors.validation.ts";
import { bytesToHex } from "./hex.ts";
import { checksumAddress } from "./utils/address.ts";
import { bytesToBigInt, bytesToBool, bytesToNumber } from "./utils/bytes.ts";

const textDecoder = new TextDecoder();

/** Throws unless `bytes[from, to)` exist and all equal `fill`. */
const assertPadding = (
  bytes: Uint8Array,
  from: number,
  to: number,
  fill: number,
  type: string,
): void => {
  let clean = to <= bytes.length;
  for (let i = from; clean && i < to; i++) {
    clean = bytes[i] === fill;
  }
  if (!clean) {
    const padding = bytesToHex(bytes.subarray(from, Math.min(to, bytes.length)));
    throw new DirtyPaddingError({ type, padding });
  }
};

/** An address: 12 zero bytes, then its 20 bytes, returned in the requested format. */
export const addressNode = (
  type: string,
  padding: boolean,
  addressFormat: AddressFormat | undefined,
): Node => ({
  dynamic: false,
  size: 32,
  read: (cursor) => {
    const at = cursor.position;
    const word = cursor.readBytes(32);
    if (padding) {
      assertPadding(cursor.bytes, at, at + 12, 0, type);
    }
    const address = bytesToHex(word.subarray(-20));
    if (addressFormat === "checksum") {
      return [checksumAddress(address), 32];
    }
    if (typeof addressFormat === "function") {
      return [addressFormat(address), 32];
    }
    return [address, 32];
  },
});

/** A bool: exactly 0 or 1, always (like viem). */
export const boolNode = (): Node => ({
  dynamic: false,
  size: 32,
  read: (cursor) => [bytesToBool(cursor.readBytes(32)), 32],
});

/**
 * `uintN` / `intN`: a `bigint` above 48 bits, a `number` otherwise, read from the whole word like
 * viem. The padding is the sign extension of the `N`-bit value.
 */
export const numberNode = (type: string, checkPadding: boolean): Node => {
  const signed = type.startsWith("int");
  const bits = Number.parseInt(type.split("int")[1] || "256", 10);
  const valid = bits >= 8 && bits <= 256 && bits % 8 === 0;
  const padding = valid ? 32 - bits / 8 : 0;
  return {
    dynamic: false,
    size: 32,
    read: (cursor) => {
      const at = cursor.position;
      const word = cursor.readBytes(32);
      if (checkPadding && padding > 0) {
        const value = word[padding];
        const fill = signed && value !== undefined && value >= 0x80 ? 0xff : 0;
        assertPadding(cursor.bytes, at, at + padding, fill, type);
      }
      return [bits > 48 ? bytesToBigInt(word, { signed }) : bytesToNumber(word, { signed }), 32];
    },
  };
};

/** `bytesN`: its `N` bytes, left-aligned in the word. */
export const fixedBytesNode = (type: string, length: number, padding: boolean): Node => ({
  dynamic: false,
  size: 32,
  read: (cursor) => {
    const at = cursor.position;
    const value = bytesToHex(cursor.readBytes(length, 32));
    if (padding && length >= 1 && length <= 32) {
      assertPadding(cursor.bytes, at + length, at + 32, 0, type);
    }
    return [value, 32];
  },
});

/** `bytes` / `string`: an offset to their length, then the content padded to whole words. */
export const byteTailNode = (
  type: string,
  isString: boolean,
  padding: boolean,
  canonicalOffsets: boolean,
): Node => ({
  dynamic: true,
  size: 32,
  read: (cursor, staticPosition, frame) => {
    const start = readOffset(cursor, staticPosition, canonicalOffsets, frame, type);
    cursor.setPosition(start);
    const length = bytesToNumber(cursor.readBytes(32));
    const value = length === 0 ? (isString ? "" : "0x") : readContent(cursor, length, isString);
    const end = safeAddSize(safeAddSize(start, 32), ceil32(length));
    if (padding) {
      assertPadding(cursor.bytes, start + 32 + length, end, 0, type);
    }
    cursor.setPosition(staticPosition + 32);
    closeTail(frame, end);
    return [value, 32];
  },
});

/** Invalid UTF-8 becomes U+FFFD, like viem. */
const readContent = (cursor: Cursor, length: number, isString: boolean): string =>
  isString
    ? textDecoder.decode(cursor.readBytes(length, 32))
    : bytesToHex(cursor.readBytes(length));
