/*
 * Errors specific to functions: the viem@2.56.9 ones (`src/errors/{abi,data}.ts`) and those of the
 * input, selection and selector checks.
 */
import { formatAbiItem } from "../abi.signature.ts";
import type { AbiParameter, Hex } from "../abi.types.ts";
import { BaseError } from "../errors.base.ts";

type NamedItem = { readonly name: string; readonly inputs: readonly AbiParameter[] };

/** A decoder argument, data or option does not have the required runtime shape. */
export class InvalidFunctionInputError extends BaseError {
  readonly reason: string;

  constructor(reason: string) {
    super(`Invalid function input: ${reason}.`, { name: "InvalidFunctionInputError" });
    this.reason = reason;
  }
}

/** The function cannot be planned safely, independently of optional type validation. */
export class InvalidAbiFunctionError extends BaseError {
  readonly reason: string;

  constructor(reason: string) {
    super(`Invalid ABI function: ${reason}.`, { name: "InvalidAbiFunctionError" });
    this.reason = reason;
  }
}

/** `functionName` does not match the function selected by the calldata selector. */
export class AbiFunctionNameMismatchError extends BaseError {
  readonly expected: string;
  readonly actual: string;

  constructor({ expected, actual }: { expected: string; actual: string }) {
    super(`Expected function "${expected}", but the selector selected "${actual}".`, {
      name: "AbiFunctionNameMismatchError",
    });
    this.expected = expected;
    this.actual = actual;
  }
}

/** `validateSelectorSize`: calldata shorter than its 4-byte selector. */
export class InvalidSelectorSizeError extends BaseError {
  readonly size: number;

  constructor({ size }: { size: number }) {
    super(`Calldata of ${size} bytes is shorter than a 4-byte selector.`, {
      name: "InvalidSelectorSizeError",
    });
    this.size = size;
  }
}

export class AbiFunctionSignatureNotFoundError extends BaseError {
  readonly signature: Hex;

  constructor(signature: Hex) {
    super(
      `Encoded function signature "${signature}" not found on ABI.\n` +
        "Make sure you are using the correct ABI and that the function exists on it.\n" +
        `You can look up the signature here: https://4byte.sourcify.dev/?q=${signature}.`,
      { name: "AbiFunctionSignatureNotFoundError" },
    );
    this.signature = signature;
  }
}

export class AbiFunctionNotFoundError extends BaseError {
  constructor(functionName?: string | undefined) {
    super(
      `Function ${functionName ? `"${functionName}" ` : ""}not found on ABI.\n` +
        "Make sure you are using the correct ABI and that the function exists on it.",
      { name: "AbiFunctionNotFoundError" },
    );
  }
}

export class AbiFunctionOutputsNotFoundError extends BaseError {
  constructor(functionName: string) {
    super(
      `Function "${functionName}" does not contain any \`outputs\` on ABI.\n` +
        "Cannot decode function result without knowing what the parameter types are.\n" +
        "Make sure you are using the correct ABI and that the function exists on it.",
      { name: "AbiFunctionOutputsNotFoundError" },
    );
  }
}

/** Two overloads match the arguments with types that encode differently (`address`/`bytes20`…). */
export class AbiItemAmbiguityError extends BaseError {
  readonly items: readonly [
    { readonly abiItem: NamedItem; readonly type: string },
    { readonly abiItem: NamedItem; readonly type: string },
  ];

  constructor(x: { abiItem: NamedItem; type: string }, y: { abiItem: NamedItem; type: string }) {
    super(
      "Found ambiguous types in overloaded ABI items.\n" +
        `\`${x.type}\` in \`${formatAbiItem(x.abiItem)}\`, and ` +
        `\`${y.type}\` in \`${formatAbiItem(y.abiItem)}\`.`,
      { name: "AbiItemAmbiguityError" },
    );
    this.items = [x, y];
  }
}

/** viem's `slice(data, 4)` of calldata that is only a selector. */
export class SliceOffsetOutOfBoundsError extends BaseError {
  readonly offset: number;
  readonly position: "start" | "end";
  readonly size: number;

  constructor({
    offset,
    position,
    size,
  }: {
    offset: number;
    position: "start" | "end";
    size: number;
  }) {
    super(
      `Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size}).`,
      { name: "SliceOffsetOutOfBoundsError" },
    );
    this.offset = offset;
    this.position = position;
    this.size = size;
  }
}
