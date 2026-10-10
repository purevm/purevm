/*
 * Errors specific to event logs: the viem@2.56.9 ones (`src/errors/abi.ts`) and those of the
 * input, selection and topic checks.
 */
import { formatAbiItem } from "../abi.signature.ts";
import type { AbiEvent, AbiParameter, Hex } from "../abi.types.ts";
import { BaseError } from "../errors.base.ts";

/** A decoder argument, payload or option does not have the required runtime shape. */
export class InvalidEventLogInputError extends BaseError {
  readonly reason: string;

  constructor(reason: string) {
    super(`Invalid event log input: ${reason}.`, { name: "InvalidEventLogInputError" });
    this.reason = reason;
  }
}

/** `eventName` does not match the event selected by topic0. */
export class AbiEventNameMismatchError extends BaseError {
  readonly expected: string;
  readonly actual: string;

  constructor({ expected, actual }: { expected: string; actual: string }) {
    super(`Expected event "${expected}", but topic0 selected "${actual}".`, {
      name: "AbiEventNameMismatchError",
    });
    this.expected = expected;
    this.actual = actual;
  }
}

/** The event cannot be planned safely, independently of optional type validation. */
export class InvalidAbiEventError extends BaseError {
  readonly reason: string;

  constructor(reason: string) {
    super(`Invalid ABI event: ${reason}.`, { name: "InvalidAbiEventError" });
    this.reason = reason;
  }
}

export class AbiEventSignatureEmptyTopicsError extends BaseError {
  constructor() {
    super("Cannot extract event signature from empty topics.", {
      name: "AbiEventSignatureEmptyTopicsError",
    });
  }
}

export class AbiEventSignatureNotFoundError extends BaseError {
  readonly signature: Hex;

  constructor(signature: Hex) {
    super(
      `Encoded event signature "${signature}" not found on ABI.\n` +
        "Make sure you are using the correct ABI and that the event exists on it.\n" +
        `You can look up the signature here: https://4byte.sourcify.dev/?q=${signature}.`,
      { name: "AbiEventSignatureNotFoundError" },
    );
    this.signature = signature;
  }
}

export class DecodeLogTopicsMismatch extends BaseError {
  readonly param: AbiParameter;

  constructor({ abiItem, param }: { abiItem: AbiEvent; param: AbiParameter }) {
    const name = param.name ? ` "${param.name}"` : "";
    const event = formatAbiItem(abiItem, { includeName: true });
    super(`Expected a topic for indexed event parameter${name} on event "${event}".`, {
      name: "DecodeLogTopicsMismatch",
    });
    this.param = param;
  }
}

export class DecodeLogDataMismatch extends BaseError {
  readonly params: readonly AbiParameter[];
  readonly size: number;

  constructor({ params, size }: { params: readonly AbiParameter[]; size: number }) {
    super(`Data size of ${size} bytes is too small for non-indexed event parameters.`, {
      name: "DecodeLogDataMismatch",
    });
    this.params = params;
    this.size = size;
  }
}

/** `validateTopicCount`: topics after the last indexed parameter. */
export class TooManyTopicsError extends BaseError {
  readonly expected: number;
  readonly count: number;

  constructor({ expected, count }: { expected: number; count: number }) {
    super(`Expected ${expected} topics, the log has ${count}.`, { name: "TooManyTopicsError" });
    this.expected = expected;
    this.count = count;
  }
}

/** `validateTopicSize`: an argument topic that is not exactly one 32-byte word. */
export class InvalidTopicSizeError extends BaseError {
  readonly index: number;
  readonly size: number;

  constructor({ index, size }: { index: number; size: number }) {
    super(`Topic ${index} is ${size} bytes, expected 32.`, { name: "InvalidTopicSizeError" });
    this.index = index;
    this.size = size;
  }
}
