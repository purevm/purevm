/* Errors raised by input, ABI and canonical-encoding validation. */
import type { Hex } from "./abi.types.ts";
import { BaseError } from "./errors.base.ts";

/** A derived ABI size cannot be represented exactly as a JavaScript number. */
export class SizeOutOfRangeError extends BaseError {
  readonly left: number;
  readonly operation: "+" | "*";
  readonly right: number;

  constructor({ left, operation, right }: { left: number; operation: "+" | "*"; right: number }) {
    super(`ABI size ${left} ${operation} ${right} is outside the safe integer range.`, {
      name: "SizeOutOfRangeError",
    });
    this.left = left;
    this.operation = operation;
    this.right = right;
  }
}

/** Where a value checked by `validateHex` comes from. */
export type HexLocation = "abiTopic0" | "abiSelector" | "topic" | "data";

/** `validateHex`: a supplied value is not `0x` followed by whole hexadecimal bytes. */
export class InvalidHexError extends BaseError {
  readonly kind: HexLocation;
  readonly index: number | undefined;
  readonly value: string;

  constructor({
    kind,
    index,
    value,
  }: {
    kind: HexLocation;
    index?: number | undefined;
    value: string;
  }) {
    const location = kind === "topic" ? `Topic ${index}` : kind === "data" ? "Data" : kind;
    super(`${location} is not hex made of whole bytes: "${value}".`, { name: "InvalidHexError" });
    this.kind = kind;
    this.index = index;
    this.value = value;
  }
}

/** `validateTypes`: a parameter does not use a supported canonical ABI type. */
export class InvalidAbiTypeError extends BaseError {
  readonly type: string;

  constructor(type: string) {
    super(`ABI type "${type}" is not valid or is not supported.`, { name: "InvalidAbiTypeError" });
    this.type = type;
  }
}

/** `validateDataAlignment`: data that is not whole 32-byte words. */
export class DataAlignmentError extends BaseError {
  readonly size: number;

  constructor({ size }: { size: number }) {
    super(`Data size of ${size} bytes is not a multiple of 32.`, { name: "DataAlignmentError" });
    this.size = size;
  }
}

/** `validateDataLength`: bytes after the last encoded value. */
export class DataTooLongError extends BaseError {
  readonly size: number;
  readonly end: number;

  constructor({ size, end }: { size: number; end: number }) {
    super(`Data size of ${size} bytes has ${size - end} bytes after the encoding.`, {
      name: "DataTooLongError",
    });
    this.size = size;
    this.end = end;
  }
}

/** `validateCanonicalOffsets`: an offset that does not point right after the previous tail. */
export class NonCanonicalOffsetError extends BaseError {
  readonly type: string;
  readonly offset: number;
  readonly expected: number;

  constructor({ type, offset, expected }: { type: string; offset: number; expected: number }) {
    super(`Offset ${offset} of ${type} is not canonical, expected ${expected}.`, {
      name: "NonCanonicalOffsetError",
    });
    this.type = type;
    this.offset = offset;
    this.expected = expected;
  }
}

/** `validatePadding`: non-zero (or missing) bits and bytes around a value. */
export class DirtyPaddingError extends BaseError {
  readonly type: string;
  readonly padding: Hex;

  constructor({ type, padding }: { type: string; padding: Hex }) {
    super(`Padding of ${type} is not clean: ${padding}.`, { name: "DirtyPaddingError" });
    this.type = type;
    this.padding = padding;
  }
}
