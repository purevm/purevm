/* Options shared by event and function decoding, and their runtime validation. */
import type { ReaderOptions } from "./abi.nodes.ts";
import type { AddressFormat, Hex } from "./abi.types.ts";
import type { BaseError } from "./errors.base.ts";
import { InvalidHexError, type HexLocation } from "./errors.validation.ts";

/** Every extra canonicality check is enabled unless explicitly set to `false`. */
export type DecodeOptions = {
  /**
   * Address output format. `"checksum"` applies EIP-55, a function receives the raw lowercase
   * address, and `null` or omission leaves that raw value untouched.
   */
  readonly addressFormat?: AddressFormat | undefined;
  /** Require `0x` followed by an even number of hexadecimal digits (`InvalidHexError`). */
  readonly validateHex?: boolean | undefined;
  /** Validate the selected ABI item's supported types and structure (`InvalidAbiTypeError`). */
  readonly validateTypes?: boolean | undefined;
  /** Require the data to be whole 32-byte words (`DataAlignmentError`). */
  readonly validateDataAlignment?: boolean | undefined;
  /** Reject bytes after the last encoded value (`DataTooLongError`). */
  readonly validateDataLength?: boolean | undefined;
  /** Require every dynamic tail to begin at its canonical offset (`NonCanonicalOffsetError`). */
  readonly validateCanonicalOffsets?: boolean | undefined;
  /** Require clean integer, address, fixed-bytes and dynamic-bytes padding (`DirtyPaddingError`). */
  readonly validatePadding?: boolean | undefined;
};

/** The checks of `DecodeOptions`, resolved to booleans. */
export type DecodeChecks = ReaderOptions & {
  readonly hex: boolean;
  readonly types: boolean;
  readonly dataAlignment: boolean;
  readonly dataLength: boolean;
};

const COMMON_BOOLEAN_OPTIONS = [
  "validateHex",
  "validateTypes",
  "validateDataAlignment",
  "validateDataLength",
  "validateCanonicalOffsets",
  "validatePadding",
] as const satisfies readonly (keyof DecodeOptions)[];

/**
 * Checks the shape of `options` (an object whose `addressFormat` and boolean options, including
 * `extraBooleans`, have the right types) and resolves the common checks. `invalid` builds the
 * error of the calling API for a malformed option.
 */
export function resolveDecodeChecks(
  options: unknown,
  extraBooleans: readonly string[],
  invalid: (reason: string) => BaseError,
): DecodeChecks {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw invalid("options is not an object");
  }
  const record = options as Record<string, unknown> & DecodeOptions;
  const { addressFormat } = record;
  if (
    addressFormat !== undefined &&
    addressFormat !== null &&
    addressFormat !== "checksum" &&
    typeof addressFormat !== "function"
  ) {
    throw invalid("options.addressFormat is not checksum, null or a function");
  }
  for (const name of [...COMMON_BOOLEAN_OPTIONS, ...extraBooleans]) {
    const value = record[name];
    if (value !== undefined && typeof value !== "boolean") {
      throw invalid(`options.${name} is not a boolean`);
    }
  }
  return {
    addressFormat: record.addressFormat,
    hex: record.validateHex !== false,
    types: record.validateTypes !== false,
    dataAlignment: record.validateDataAlignment !== false,
    dataLength: record.validateDataLength !== false,
    canonicalOffsets: record.validateCanonicalOffsets !== false,
    padding: record.validatePadding !== false,
  };
}

const WHOLE_BYTE_HEX_PATTERN = /^0x(?:[\da-fA-F]{2})*$/;

/** `validateHex`: `value` is `0x` followed by whole hexadecimal bytes. */
export function assertHex(
  value: string,
  kind: HexLocation,
  index?: number | undefined,
): asserts value is Hex {
  if (!WHOLE_BYTE_HEX_PATTERN.test(value)) {
    throw new InvalidHexError({ kind, index, value });
  }
}
