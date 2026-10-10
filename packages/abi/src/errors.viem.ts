/*
 * The ABI decoding errors of viem@2.56.9 (`src/errors/{cursor,encoding,abi}.ts`), shared by events
 * and functions: same class names and messages, without `metaMessages` (the error carries the call
 * instead).
 */
import type { AbiParameter } from "./abi.types.ts";
import { BaseError } from "./errors.base.ts";

export class PositionOutOfBoundsError extends BaseError {
  readonly length: number;
  readonly position: number;

  constructor({ length, position }: { length: number; position: number }) {
    super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, {
      name: "PositionOutOfBoundsError",
    });
    this.length = length;
    this.position = position;
  }
}

export class RecursiveReadLimitExceededError extends BaseError {
  readonly count: number;
  readonly limit: number;

  constructor({ count, limit }: { count: number; limit: number }) {
    super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, {
      name: "RecursiveReadLimitExceededError",
    });
    this.count = count;
    this.limit = limit;
  }
}

/** An offset, a length or an integer of 48 bits or less above `Number.MAX_SAFE_INTEGER`. */
export class IntegerOutOfRangeError extends BaseError {
  readonly value: bigint;

  constructor(value: bigint) {
    const range = `(${Number.MIN_SAFE_INTEGER} to ${Number.MAX_SAFE_INTEGER})`;
    super(`Number "${value}n" is not in safe integer range ${range}`, {
      name: "IntegerOutOfRangeError",
    });
    this.value = value;
  }
}

export class InvalidBytesBooleanError extends BaseError {
  readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    super(
      `Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`,
      { name: "InvalidBytesBooleanError" },
    );
    this.bytes = bytes;
  }
}

export class AbiDecodingDataSizeTooSmallError extends BaseError {
  readonly params: readonly AbiParameter[];
  readonly size: number;

  constructor({ params, size }: { params: readonly AbiParameter[]; size: number }) {
    super(`Data size of ${size} bytes is too small for given parameters.`, {
      name: "AbiDecodingDataSizeTooSmallError",
    });
    this.params = params;
    this.size = size;
  }
}

export class AbiDecodingZeroDataError extends BaseError {
  constructor() {
    super('Cannot decode zero data ("0x") with ABI parameters.', {
      name: "AbiDecodingZeroDataError",
    });
  }
}

export class InvalidAbiDecodingTypeError extends BaseError {
  readonly type: string;

  constructor(type: string) {
    super(`Type "${type}" is not a valid decoding type.\nPlease provide a valid ABI type.`, {
      name: "InvalidAbiDecodingType",
    });
    this.type = type;
  }
}
