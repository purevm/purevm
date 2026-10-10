/* Stateless canonical event-log decoding over a plan compiled for the current call. */
import type { AbiEvent, Hex } from "../abi.types.ts";
import { assertHex } from "../decode.options.ts";
import {
  AbiEventNameMismatchError,
  InvalidAbiEventError,
  InvalidEventLogInputError,
} from "./log.errors.ts";
import type { ContractEventName } from "./log.args.ts";
import {
  assertEventShape,
  compileValidatedEventPlan,
  findEvent,
  selectorOf,
  type EventPlan,
} from "./log.plan.ts";
import {
  assertEventSignature,
  attachContext,
  decodeSelectedEventLog,
  requireEventSignature,
  resolveChecks,
} from "./log.read.ts";
import type {
  AbiOf,
  DecodeEventLogOptions,
  DecodeEventLogParameters,
  DecodeEventLogResult,
} from "./log.types.ts";

export function decodeEventLog<
  const abi extends AbiEvent | readonly unknown[] | object,
  const eventName extends ContractEventName<AbiOf<abi>> | undefined = undefined,
  const topics extends readonly Hex[] = readonly Hex[],
  const data extends Hex | undefined = undefined,
>(
  parameters: DecodeEventLogParameters<abi, eventName, topics, data>,
): DecodeEventLogResult<abi, eventName, topics, data> {
  let inputAbi: unknown;
  let abiTopic0: Hex | undefined;
  let expectedEventName: string | undefined;
  let options: DecodeEventLogOptions = {};
  let payload: unknown;
  let event: AbiEvent | undefined;
  try {
    if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
      throw new InvalidEventLogInputError("parameters is not an object");
    }
    const input = parameters as unknown as {
      readonly abi?: unknown;
      readonly abiTopic0?: unknown;
      readonly eventName?: unknown;
      readonly options?: unknown;
      readonly payload?: unknown;
    };
    inputAbi = input.abi;
    payload = input.payload;
    if (input.abiTopic0 !== undefined && typeof input.abiTopic0 !== "string") {
      throw new InvalidEventLogInputError("abiTopic0 is not a string");
    }
    abiTopic0 = input.abiTopic0 as Hex | undefined;
    if (input.eventName !== undefined && typeof input.eventName !== "string") {
      throw new InvalidEventLogInputError("eventName is not a string");
    }
    expectedEventName = input.eventName;
    const inputOptions = input.options ?? {};
    const checks = resolveChecks(inputOptions);
    options = inputOptions as DecodeEventLogOptions;
    if (checks.hex && abiTopic0 !== undefined) {
      assertHex(abiTopic0, "abiTopic0");
    }

    let firstTopic = 1;
    let selectPlanFactory: (signature: Hex | undefined) => () => EventPlan;
    if (!Array.isArray(inputAbi)) {
      assertEventShape(inputAbi);
      event = inputAbi;
      const selectedEvent = event;
      if (event.anonymous) {
        if (abiTopic0 !== undefined) {
          throw new InvalidAbiEventError("an anonymous event cannot have an abiTopic0");
        }
        firstTopic = 0;
        assertEventName(selectedEvent, expectedEventName);
        selectPlanFactory = () => () =>
          compileValidatedEventPlan(selectedEvent, checks.types, checks);
      } else {
        selectPlanFactory = (signature) => {
          assertEventSignature(signature, abiTopic0 ?? selectorOf(selectedEvent));
          assertEventName(selectedEvent, expectedEventName);
          return () => compileValidatedEventPlan(selectedEvent, checks.types, checks);
        };
      }
    } else {
      const selectedAbi = inputAbi;
      if (abiTopic0 !== undefined) {
        throw new InvalidAbiEventError("abiTopic0 can only be supplied with one event");
      }
      selectPlanFactory = (signature) => {
        const selectedEvent = findEvent(selectedAbi, requireEventSignature(signature));
        event = selectedEvent;
        assertEventName(selectedEvent, expectedEventName);
        return () => compileValidatedEventPlan(selectedEvent, checks.types, checks);
      };
    }

    return decodeSelectedEventLog(
      payload,
      firstTopic,
      checks,
      selectPlanFactory,
    ) as DecodeEventLogResult<abi, eventName, topics, data>;
  } catch (error) {
    attachContext(error, { abi: event ?? inputAbi, abiTopic0, payload, options });
    throw error;
  }
}

function assertEventName(event: AbiEvent, expected: string | undefined): void {
  if (expected !== undefined && event.name !== expected) {
    throw new AbiEventNameMismatchError({ expected, actual: event.name });
  }
}
