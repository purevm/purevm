/* Explicit compilation: the returned function is the only persistent decoder state. */
import type { AbiEvent, Hex } from "../abi.types.ts";
import { assertHex } from "../decode.options.ts";
import { InvalidAbiEventError, InvalidEventLogInputError } from "./log.errors.ts";
import { AbiEventSignatureNotFoundError } from "./log.errors.ts";
import {
  compileValidatedEventPlan,
  selectorOf,
  snapshotEvent,
  type EventPlan,
} from "./log.plan.ts";
import {
  assertEventSignature,
  attachContext,
  decodeSelectedEventLog,
  requireEventSignature,
  resolveChecks,
  type LogChecks,
} from "./log.read.ts";
import type {
  CompileEventLogDecoderParameters,
  DecodeEventLogOptions,
  EventLogDecoder,
} from "./log.types.ts";

/**
 * Compiles a decoder for one event, or for every event of an ABI. All the work that depends only
 * on the ABI (snapshots, selectors, plans, the topic0 table) happens here, once; the returned
 * function keeps it, and nothing is cached anywhere else.
 */
export function compileEventLogDecoder<const abi extends AbiEvent | readonly unknown[]>(
  parameters: CompileEventLogDecoderParameters<abi>,
): EventLogDecoder<abi> {
  let inputAbi: unknown;
  let abiTopic0: Hex | undefined;
  let options: Readonly<DecodeEventLogOptions> = Object.freeze({});
  try {
    if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
      throw new InvalidEventLogInputError("parameters is not an object");
    }
    const input = parameters as unknown as {
      readonly abi?: unknown;
      readonly abiTopic0?: unknown;
      readonly options?: unknown;
    };
    inputAbi = input.abi;
    if (input.abiTopic0 !== undefined && typeof input.abiTopic0 !== "string") {
      throw new InvalidEventLogInputError("abiTopic0 is not a string");
    }
    abiTopic0 = input.abiTopic0 as Hex | undefined;
    const inputOptions = input.options ?? {};
    const checks = resolveChecks(inputOptions);
    options = Object.freeze({ ...(inputOptions as DecodeEventLogOptions) });
    if (checks.hex && abiTopic0 !== undefined) {
      assertHex(abiTopic0, "abiTopic0");
    }
    const decoder = Array.isArray(inputAbi)
      ? compileAbiDecoder(inputAbi, abiTopic0, checks, options)
      : compileEventDecoder(inputAbi, abiTopic0, checks, options);
    return decoder as EventLogDecoder<abi>;
  } catch (error) {
    attachContext(error, { abi: inputAbi, abiTopic0, payload: undefined, options });
    throw error;
  }
}

type CompiledDecoder = ((payload: unknown) => unknown) & {
  readonly abi: unknown;
  readonly abiTopic0: Hex | undefined;
  readonly options: Readonly<DecodeEventLogOptions>;
};

/** Gives the decoder its read-only `abi`, `abiTopic0` and `options`. */
function describe(
  decode: (payload: unknown) => unknown,
  abi: unknown,
  abiTopic0: Hex | undefined,
  options: Readonly<DecodeEventLogOptions>,
): CompiledDecoder {
  return Object.defineProperties(decode, {
    abi: { value: abi, enumerable: true },
    abiTopic0: { value: abiTopic0, enumerable: true },
    options: { value: options, enumerable: true },
  }) as CompiledDecoder;
}

/** One event: its topic0 is `abiTopic0`, its selector, or none when it is anonymous. */
function compileEventDecoder(
  inputAbi: unknown,
  abiTopic0: Hex | undefined,
  checks: LogChecks,
  options: Readonly<DecodeEventLogOptions>,
): CompiledDecoder {
  const snapshot = snapshotEvent(inputAbi);
  if (snapshot.anonymous && abiTopic0 !== undefined) {
    throw new InvalidAbiEventError("an anonymous event cannot have an abiTopic0");
  }
  const plan = compileValidatedEventPlan(snapshot, checks.types, checks);
  const expected = snapshot.anonymous ? undefined : (abiTopic0 ?? selectorOf(snapshot));
  const firstTopic = expected === undefined ? 0 : 1;
  const createPlan = () => plan;
  const selectPlanFactory = (signature: Hex | undefined) => {
    if (expected !== undefined) {
      assertEventSignature(signature, expected);
    }
    return createPlan;
  };

  const decode = (payload: unknown) => {
    try {
      return decodeSelectedEventLog(payload, firstTopic, checks, selectPlanFactory);
    } catch (error) {
      attachContext(error, { abi: snapshot, abiTopic0: expected, payload, options });
      throw error;
    }
  };
  return describe(decode, snapshot, expected, options);
}

/**
 * An ABI: every event is snapshotted and compiled now, and indexed by its selector. When two events
 * share a selector, the first wins, like viem's `abi.find`. Items that are not events are ignored;
 * a malformed event, or one whose signature cannot be hashed, fails the compilation.
 */
function compileAbiDecoder(
  inputAbi: readonly unknown[],
  abiTopic0: Hex | undefined,
  checks: LogChecks,
  options: Readonly<DecodeEventLogOptions>,
): CompiledDecoder {
  if (abiTopic0 !== undefined) {
    throw new InvalidAbiEventError("abiTopic0 can only be supplied with one event");
  }
  const events: AbiEvent[] = [];
  const plans = new Map<Hex, EventPlan>();
  for (const item of inputAbi) {
    if (item === null || typeof item !== "object") continue;
    if ((item as { readonly type?: unknown }).type !== "event") continue;
    const snapshot = snapshotEvent(item);
    events.push(snapshot);
    const selector = selectorOf(snapshot);
    if (!plans.has(selector)) {
      plans.set(selector, compileValidatedEventPlan(snapshot, checks.types, checks));
    }
  }
  const abi = Object.freeze(events);

  const decode = (payload: unknown) => {
    let selected: AbiEvent | undefined;
    try {
      return decodeSelectedEventLog(payload, 1, checks, (signature) => {
        const actual = requireEventSignature(signature);
        const plan = plans.get(actual);
        if (plan === undefined) {
          throw new AbiEventSignatureNotFoundError(actual);
        }
        selected = plan.event;
        return () => plan;
      });
    } catch (error) {
      attachContext(error, { abi: selected ?? abi, abiTopic0: undefined, payload, options });
      throw error;
    }
  };
  return describe(decode, abi, undefined, options);
}
