import type { Hex } from "./abi.types.ts";

/**
 * Base of every error this package throws, modeled on viem@2.56.9 `src/errors/base.ts`: a name, a
 * message, and the call it comes from (set by the decoding function when the error leaves it).
 */
export abstract class BaseError extends Error {
  /** The message, as viem's `shortMessage`. */
  shortMessage: string;
  override name: string = "BaseError";

  /** The ABI item decoded against once selected, otherwise the `abi` given. */
  declare abi?: unknown | undefined;
  /** Events: the expected topic0, the log and its parts. */
  declare abiTopic0?: Hex | undefined;
  declare payload?: unknown | undefined;
  declare topics?: readonly Hex[] | undefined;
  /** Functions: the expected selector, the name asked for and its arguments. */
  declare abiSelector?: Hex | undefined;
  declare functionName?: string | undefined;
  declare args?: readonly unknown[] | undefined;
  /** The data decoded: log data, calldata or return data. */
  declare data?: Hex | undefined;
  declare options?: Readonly<Record<string, unknown>> | undefined;

  constructor(shortMessage: string, { name }: { name?: string | undefined } = {}) {
    super(shortMessage || "An error occurred.");
    this.shortMessage = shortMessage;
    this.name = name ?? this.name;
  }
}
