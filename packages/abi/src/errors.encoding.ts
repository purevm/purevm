/* Errors raised while decoding hexadecimal data and normalizing ABI signatures. */
import { BaseError } from "./errors.base.ts";

/** A pair consumed by the hexadecimal decoder contains a non-hexadecimal character. */
export class InvalidByteSequenceError extends BaseError {
  readonly sequence: string;
  readonly value: string;

  constructor({ sequence, value }: { sequence: string; value: string }) {
    super(`Invalid byte sequence ("${sequence}" in "${value}").`, {
      name: "InvalidByteSequenceError",
    });
    this.sequence = sequence;
    this.value = value;
  }
}

/** An ABI signature has no complete top-level closing parenthesis. */
export class InvalidAbiSignatureError extends BaseError {
  readonly signature: string;

  constructor(signature: string) {
    super("Unable to normalize signature.", { name: "InvalidAbiSignatureError" });
    this.signature = signature;
  }
}
