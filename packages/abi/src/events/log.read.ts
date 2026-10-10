/* Shared validation and one-pass reading of an already selected, compiled event plan. */
import { decodeValue, decodeValues } from "../abi.decode.ts";
import type { Hex } from "../abi.types.ts";
import { BaseError } from "../errors.base.ts";
import { assertHex, resolveDecodeChecks, type DecodeChecks } from "../decode.options.ts";
import { DataAlignmentError, DataTooLongError, InvalidHexError } from "../errors.validation.ts";
import {
  InvalidEventLogInputError,
  InvalidTopicSizeError,
  TooManyTopicsError,
} from "./log.errors.ts";
import { AbiDecodingDataSizeTooSmallError, PositionOutOfBoundsError } from "../errors.viem.ts";
import {
  AbiEventSignatureEmptyTopicsError,
  AbiEventSignatureNotFoundError,
  DecodeLogDataMismatch,
  DecodeLogTopicsMismatch,
} from "./log.errors.ts";
import { size, strictHexToBytes } from "../hex.ts";
import type { EventPlan } from "./log.plan.ts";
import type { DecodeEventLogOptions, EventLogPayload } from "./log.types.ts";

export type LogChecks = DecodeChecks & {
  readonly topicCount: boolean;
  readonly topicSize: boolean;
};

export function resolveChecks(options: unknown): LogChecks {
  const checks = resolveDecodeChecks(
    options,
    ["validateTopicCount", "validateTopicSize"],
    (reason) => new InvalidEventLogInputError(reason),
  );
  const { validateTopicCount, validateTopicSize } = options as DecodeEventLogOptions;
  return {
    ...checks,
    topicCount: validateTopicCount !== false,
    topicSize: validateTopicSize !== false,
  };
}

type ValidatedPayloadBytes = {
  readonly topics: readonly (Uint8Array | undefined)[];
  readonly data: Uint8Array | undefined;
};

export function assertEventSignature(signature: Hex | undefined, expected: Hex): void {
  const actual = requireEventSignature(signature);
  if (actual !== expected) {
    throw new AbiEventSignatureNotFoundError(actual);
  }
}

export function requireEventSignature(signature: Hex | undefined): Hex {
  if (signature === undefined) {
    throw new AbiEventSignatureEmptyTopicsError();
  }
  return signature;
}

function isPayloadShape(value: unknown): value is EventLogPayload {
  if (value === null || typeof value !== "object") return false;
  const payload = value as { readonly topics?: unknown; readonly data?: unknown };
  if (!Array.isArray(payload.topics)) return false;
  if (!payload.topics.every((topic) => typeof topic === "string")) return false;
  return payload.data === undefined || typeof payload.data === "string";
}

function assertPayloadShape(value: unknown): asserts value is EventLogPayload {
  if (!isPayloadShape(value)) {
    throw new InvalidEventLogInputError(
      "payload must contain a topics string array and optional data string",
    );
  }
}

function assertPayloadHex(
  payload: EventLogPayload,
  firstTopic: number,
  checks: LogChecks,
): ValidatedPayloadBytes | undefined {
  if (!checks.hex) return undefined;
  const topicBytes = Array.from<Uint8Array | undefined>({ length: payload.topics.length });
  for (let index = firstTopic; index < payload.topics.length; index++) {
    const topic = payload.topics[index];
    if (topic === undefined) {
      throw new InvalidHexError({ kind: "topic", index, value: "undefined" });
    }
    const bytes = strictHexToBytes(topic);
    if (bytes === undefined) {
      throw new InvalidHexError({ kind: "topic", index, value: topic });
    }
    topicBytes[index] = bytes;
  }
  let dataBytes: Uint8Array | undefined;
  if (payload.data !== undefined) {
    dataBytes = strictHexToBytes(payload.data);
    if (dataBytes === undefined) {
      throw new InvalidHexError({ kind: "data", value: payload.data });
    }
  }
  return { topics: topicBytes, data: dataBytes };
}

export function attachContext(
  error: unknown,
  context: {
    readonly abi: unknown;
    readonly abiTopic0: Hex | undefined;
    readonly payload: unknown;
    readonly options: DecodeEventLogOptions;
  },
): void {
  if (!(error instanceof BaseError)) return;
  const payload = isPayloadShape(context.payload) ? context.payload : undefined;
  Object.assign(error, {
    ...context,
    payload,
    topics: payload?.topics,
    data: payload?.data,
  });
}

function readSignature(payload: EventLogPayload, checks: LogChecks): Hex {
  const signature = payload.topics[0];
  if (!signature) {
    throw new AbiEventSignatureEmptyTopicsError();
  }
  if (checks.hex) {
    assertHex(signature, "topic", 0);
  }
  return signature;
}

type DecodedArguments = unknown[];

type PlanFactory = () => EventPlan;
type SelectPlanFactory = (signature: Hex | undefined) => PlanFactory;

export function decodeSelectedEventLog(
  payload: unknown,
  firstTopic: number,
  checks: LogChecks,
  selectPlanFactory: SelectPlanFactory,
): { eventName: string; args?: DecodedArguments | undefined } {
  assertPayloadShape(payload);
  const signature = firstTopic === 0 ? undefined : readSignature(payload, checks);
  const createPlan = selectPlanFactory(signature);
  const validatedBytes = assertPayloadHex(payload, firstTopic, checks);
  return decodePlan(createPlan(), payload, firstTopic, checks, validatedBytes);
}

function decodePlan(
  plan: EventPlan,
  payload: EventLogPayload,
  firstTopic: number,
  checks: LogChecks,
  validatedBytes: ValidatedPayloadBytes | undefined,
): { eventName: string; args?: DecodedArguments | undefined } {
  const args: DecodedArguments = [];
  readTopics(plan, payload.topics, firstTopic, checks, validatedBytes?.topics, args);
  readData(plan, payload.data, checks, validatedBytes?.data, args);
  return {
    eventName: plan.eventName,
    args: plan.inputCount > 0 ? args : undefined,
  };
}

function readTopics(
  plan: EventPlan,
  topics: readonly Hex[],
  first: number,
  checks: LogChecks,
  validatedBytes: readonly (Uint8Array | undefined)[] | undefined,
  args: DecodedArguments,
): void {
  for (let index = 0; index < plan.indexed.length; index++) {
    const input = plan.indexed[index];
    if (input === undefined) continue;
    const { param, argIndex, node } = input;
    const topicIndex = first + index;
    const topic = topics[topicIndex];
    if (!topic) {
      throw new DecodeLogTopicsMismatch({ abiItem: plan.event, param });
    }
    const bytes = validatedBytes?.[topicIndex];
    if (checks.topicSize) {
      const topicSize = bytes?.length ?? size(topic);
      if (topicSize !== 32) {
        throw new InvalidTopicSizeError({ index: topicIndex, size: topicSize });
      }
    }
    const value = node === null ? topic : decodeValue(node, param, topic, bytes);
    args[argIndex] = value;
  }
  if (checks.topicCount && topics.length - first > plan.indexed.length) {
    throw new TooManyTopicsError({
      expected: first + plan.indexed.length,
      count: topics.length,
    });
  }
}

function readData(
  plan: EventPlan,
  data: Hex | undefined,
  checks: LogChecks,
  validatedBytes: Uint8Array | undefined,
  args: DecodedArguments,
): void {
  const { nonIndexed } = plan;
  const present = data !== undefined && data !== "0x" && data !== ("" as Hex);
  const dataSize = validatedBytes?.length ?? (data === undefined ? 0 : size(data));
  if (checks.dataAlignment && present && dataSize % 32 !== 0) {
    throw new DataAlignmentError({ size: dataSize });
  }
  if (nonIndexed.length === 0) {
    if (checks.dataLength && present) {
      throw new DataTooLongError({ size: dataSize, end: 0 });
    }
    return;
  }
  if (!present) {
    throw new DecodeLogDataMismatch({ params: nonIndexed, size: 0 });
  }

  let decoded;
  try {
    decoded = decodeValues(plan.nonIndexedNodes, nonIndexed, plan.headSize, data, validatedBytes);
  } catch (error) {
    if (
      error instanceof AbiDecodingDataSizeTooSmallError ||
      error instanceof PositionOutOfBoundsError
    ) {
      throw new DecodeLogDataMismatch({ params: nonIndexed, size: dataSize });
    }
    throw error;
  }
  if (checks.dataLength && decoded.end < decoded.length) {
    throw new DataTooLongError({ size: decoded.length, end: decoded.end });
  }

  for (let index = 0; index < decoded.values.length; index++) {
    const argIndex = plan.nonIndexedArgIndices[index];
    if (argIndex !== undefined) {
      args[argIndex] = decoded.values[index];
    }
  }
}
