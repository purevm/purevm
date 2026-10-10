/*
 * Stateless compilation of an event into the immutable plan used by the decoder. `decodeEventLog`
 * builds one plan for one call; `compileEventLogDecoder` keeps that plan in its returned closure.
 */
import { compileParameter } from "../abi.compile.ts";
import { assertParameterShape, validateParameterType } from "../abi.validate.ts";
import { safeAddSize, type Node, type ReaderOptions } from "../abi.nodes.ts";
import { formatAbiItem, toEventSelector } from "../abi.signature.ts";
import type { AbiEvent, AbiEventParameter, AbiParameter, Hex } from "../abi.types.ts";
import { InvalidAbiEventError } from "./log.errors.ts";
import { AbiEventSignatureNotFoundError } from "./log.errors.ts";

export type EventPlan = {
  readonly event: AbiEvent;
  readonly eventName: string;
  readonly inputCount: number;
  readonly indexed: readonly {
    readonly param: AbiParameter;
    readonly argIndex: number;
    readonly node: Node | null;
  }[];
  readonly nonIndexed: readonly AbiParameter[];
  readonly nonIndexedArgIndices: readonly number[];
  readonly nonIndexedNodes: readonly Node[];
  readonly headSize: number;
};

const isHashed = (type: string): boolean =>
  type === "string" || type === "bytes" || type === "tuple" || /^(.*)\[(\d+)?\]$/.test(type);

const invalidEvent = (reason: string): InvalidAbiEventError => new InvalidAbiEventError(reason);

/** Checks the minimum shape needed to safely format and compile an event. */
export function assertEventShape(value: unknown): asserts value is AbiEvent {
  if (value === null || typeof value !== "object") {
    throw new InvalidAbiEventError("the value is not an object");
  }
  const event = value as Partial<AbiEvent>;
  if (event.type !== "event") {
    throw new InvalidAbiEventError('"type" is not "event"');
  }
  if (typeof event.name !== "string") {
    throw new InvalidAbiEventError('"name" is not a string');
  }
  if (!Array.isArray(event.inputs)) {
    throw new InvalidAbiEventError('"inputs" is not an array');
  }
  for (let index = 0; index < event.inputs.length; index++) {
    assertParameterShape(event.inputs[index], `inputs[${index}]`, 0, invalidEvent);
  }
}

/** Checks supported ABI types and the event constraints enforced by `validateTypes`. */
function validateEventTypes(event: AbiEvent): void {
  if (event.anonymous !== undefined && typeof event.anonymous !== "boolean") {
    throw new InvalidAbiEventError('"anonymous" is not a boolean');
  }
  let indexedCount = 0;
  for (let index = 0; index < event.inputs.length; index++) {
    const param = event.inputs[index];
    if (param === undefined) continue;
    if (param.name !== undefined && typeof param.name !== "string") {
      throw new InvalidAbiEventError("an input name is not a string");
    }
    if (param.indexed !== undefined && typeof param.indexed !== "boolean") {
      throw new InvalidAbiEventError('an input "indexed" value is not a boolean');
    }
    if (param.indexed) {
      indexedCount++;
    }
    validateParameterType(param, `inputs[${index}]`, invalidEvent);
  }
  const maximum = event.anonymous ? 4 : 3;
  if (indexedCount > maximum) {
    throw new InvalidAbiEventError(
      `the event has ${indexedCount} indexed inputs, but at most ${maximum} are allowed`,
    );
  }
}

/** Compiles an event whose structure has already been checked by the caller. */
export function compileValidatedEventPlan(
  event: AbiEvent,
  validateTypes: boolean,
  readerOptions: ReaderOptions,
): EventPlan {
  if (validateTypes) {
    validateEventTypes(event);
  }
  const { inputs } = event;
  const indexed: EventPlan["indexed"][number][] = [];
  const nonIndexed: AbiParameter[] = [];
  const nonIndexedArgIndices: number[] = [];
  const nonIndexedNodes: Node[] = [];
  let headSize = 0;

  for (let argIndex = 0; argIndex < inputs.length; argIndex++) {
    const param = inputs[argIndex];
    if (param === undefined) continue;
    if (param.indexed) {
      indexed.push({
        param,
        argIndex,
        node: isHashed(param.type) ? null : compileParameter(param, readerOptions),
      });
    } else {
      const node = compileParameter(param, readerOptions);
      nonIndexed.push(param);
      nonIndexedArgIndices.push(argIndex);
      nonIndexedNodes.push(node);
      headSize = safeAddSize(headSize, node.size);
    }
  }

  return {
    event,
    eventName: event.name,
    inputCount: inputs.length,
    indexed,
    nonIndexed,
    nonIndexedArgIndices,
    nonIndexedNodes,
    headSize,
  };
}

export function selectorOf(event: AbiEvent): Hex {
  return toEventSelector(formatAbiItem(event));
}

/** Stateless equivalent of viem's ordered `abi.find`. */
export function findEvent(abi: readonly unknown[], signature: Hex): AbiEvent {
  for (const item of abi) {
    if (
      item === null ||
      typeof item !== "object" ||
      (item as { readonly type?: unknown | undefined }).type !== "event"
    ) {
      continue;
    }
    assertEventShape(item);
    if (selectorOf(item) === signature) {
      return item;
    }
  }
  throw new AbiEventSignatureNotFoundError(signature);
}

/** A detached event for a compiled decoder: later mutations cannot change its plan or errors. */
export function snapshotEvent(event: unknown): AbiEvent {
  assertEventShape(event);
  const snapshot = {
    type: "event",
    name: event.name,
    ...(event.anonymous === undefined ? {} : { anonymous: event.anonymous }),
    inputs: Object.freeze(event.inputs.map(cloneParameter)),
  } satisfies AbiEvent;
  return Object.freeze(snapshot);
}

function cloneParameter(param: AbiEventParameter): AbiEventParameter {
  const { components } = param;
  const clone = {
    type: param.type,
    ...(param.name === undefined ? {} : { name: param.name }),
    ...(param.internalType === undefined ? {} : { internalType: param.internalType }),
    ...(param.indexed === undefined ? {} : { indexed: param.indexed }),
    ...(components === undefined
      ? {}
      : { components: Object.freeze(components.map(cloneParameter)) }),
  } satisfies AbiEventParameter;
  return Object.freeze(clone);
}
