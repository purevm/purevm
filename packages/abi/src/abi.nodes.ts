/*
 * The compiled readers of the ABI decoder: one immutable `Node` per parameter in an event plan.
 * A compiled decoder reuses that plan for every log; the stateless API builds it for one call.
 */
import type { Cursor } from "./abi.cursor.ts";
import type { AddressFormat } from "./abi.types.ts";
import { NonCanonicalOffsetError, SizeOutOfRangeError } from "./errors.validation.ts";
import { bytesToNumber } from "./utils/bytes.ts";

/** Options captured by compiled ABI readers. */
export type ReaderOptions = {
  readonly addressFormat: AddressFormat | undefined;
  readonly canonicalOffsets: boolean;
  readonly padding: boolean;
};

/**
 * A head and its tails: the parameters of the data, of a dynamic tuple or of a dynamic array.
 * Offsets are relative to `base`; `next` is where the next tail must start to be canonical, and
 * `end` the furthest byte read so far.
 */
export type Frame = { readonly base: number; next: number; end: number };

/** The value, and the bytes it takes in the head (viem's `consumed`). */
export type Decoded = readonly [value: unknown, consumed: number];

export type Node = {
  /** viem's `hasDynamicChild`: the head holds an offset to a tail. */
  readonly dynamic: boolean;
  /** Bytes in the head: 32 for a dynamic value, the inline size of a static one. */
  readonly size: number;
  /** Reads at the cursor; `staticPosition` is the start of the enclosing head (`frame.base`). */
  readonly read: (cursor: Cursor, staticPosition: number, frame: Frame) => Decoded;
};

export function safeAddSize(left: number, right: number): number {
  const result = left + right;
  if (!Number.isSafeInteger(result)) {
    throw new SizeOutOfRangeError({ left, operation: "+", right });
  }
  return result;
}

export function safeMultiplySize(left: number, right: number): number {
  const result = left * right;
  if (!Number.isSafeInteger(result)) {
    throw new SizeOutOfRangeError({ left, operation: "*", right });
  }
  return result;
}

/** A new frame of `headSize` bytes starting at `base`. */
export const frameAt = (base: number, headSize: number): Frame => ({
  base,
  next: headSize,
  end: safeAddSize(base, headSize),
});

/** Reads the offset word of a dynamic value and returns where its tail starts. */
export const readOffset = (
  cursor: Cursor,
  staticPosition: number,
  canonicalOffsets: boolean,
  frame: Frame,
  type: string,
): number => {
  const offset = bytesToNumber(cursor.readBytes(32));
  if (canonicalOffsets && offset !== frame.next) {
    throw new NonCanonicalOffsetError({ type, offset, expected: frame.next });
  }
  return safeAddSize(staticPosition, offset);
};

/** Records a tail ending at `end`: the next tail must start there. */
export const closeTail = (frame: Frame, end: number): void => {
  frame.next = end - frame.base;
  if (end > frame.end) {
    frame.end = end;
  }
};

export const ceil32 = (size: number): number => {
  const remainder = size % 32;
  return remainder === 0 ? size : safeAddSize(size, 32 - remainder);
};
