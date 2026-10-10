/*
 * One-pass reading of calldata and return data against a compiled function plan, like viem@2.56.9
 * `decodeFunctionData` / `decodeFunctionResult`, plus the strict checks of the options.
 */
import { decodeValues, type DecodedValues } from "../abi.decode.ts";
import type { Hex } from "../abi.types.ts";
import { assertHex, resolveDecodeChecks, type DecodeChecks } from "../decode.options.ts";
import { BaseError } from "../errors.base.ts";
import { DataAlignmentError, DataTooLongError } from "../errors.validation.ts";
import { size } from "../hex.ts";
import {
  AbiFunctionOutputsNotFoundError,
  InvalidFunctionInputError,
  InvalidSelectorSizeError,
  SliceOffsetOutOfBoundsError,
} from "./function.errors.ts";
import type { FunctionPlan, ParameterPlan } from "./function.plan.ts";
import type { DecodeFunctionOptions } from "./function.types.ts";

export type FunctionChecks = DecodeChecks & {
  readonly selectorSize: boolean;
};

export function resolveFunctionChecks(options: unknown): FunctionChecks {
  const checks = resolveDecodeChecks(
    options,
    ["validateSelectorSize"],
    (reason) => new InvalidFunctionInputError(reason),
  );
  const { validateSelectorSize } = options as DecodeFunctionOptions;
  return { ...checks, selectorSize: validateSelectorSize !== false };
}

/** `data` is a string, and with `validateHex` hex made of whole bytes. */
export function assertData(data: unknown, checks: FunctionChecks): asserts data is Hex {
  if (typeof data !== "string") {
    throw new InvalidFunctionInputError("data is not a string");
  }
  if (checks.hex) {
    assertHex(data, "data");
  }
}

/** viem's `slice(data, 0, 4)`: the selector, shorter for calldata shorter than 4 bytes. */
export function readSelector(data: Hex, checks: FunctionChecks): Hex {
  if (checks.selectorSize && size(data) < 4) {
    throw new InvalidSelectorSizeError({ size: size(data) });
  }
  return `0x${data.replace("0x", "").slice(0, 8)}`;
}

/** The arguments of calldata: `undefined` when the function has no inputs, like viem. */
export function decodeArguments(
  plan: FunctionPlan,
  data: Hex,
  checks: FunctionChecks,
): unknown[] | undefined {
  const dataSize = size(data);
  if (plan.inputs.params.length === 0) {
    // viem ignores what follows the selector; canonical calldata has nothing.
    const extra = Math.max(dataSize - 4, 0);
    if (checks.dataAlignment && extra % 32 !== 0) {
      throw new DataAlignmentError({ size: extra });
    }
    if (checks.dataLength && extra > 0) {
      throw new DataTooLongError({ size: extra, end: 0 });
    }
    return undefined;
  }
  // viem's `slice(data, 4)`, which fails on calldata that is only (or less than) a selector.
  if (4 > dataSize - 1) {
    throw new SliceOffsetOutOfBoundsError({ offset: 4, position: "start", size: dataSize });
  }
  const rest = `0x${data.replace("0x", "").slice(8)}` as Hex;
  return [...decodeChecked(plan.inputs, rest, checks).values];
}

/** The return data: no output gives `undefined`, one its value, several an array. */
export function decodeOutputs(plan: FunctionPlan, data: Hex, checks: FunctionChecks): unknown {
  if (plan.outputs === undefined) {
    throw new AbiFunctionOutputsNotFoundError(plan.functionName);
  }
  const { values } = decodeChecked(plan.outputs, data, checks);
  if (values.length > 1) return [...values];
  if (values.length === 1) return values[0];
  return undefined;
}

/** Alignment, then the one-pass decoding (offsets and padding), then the length. */
function decodeChecked(plan: ParameterPlan, data: Hex, checks: FunctionChecks): DecodedValues {
  const dataSize = size(data);
  if (checks.dataAlignment && dataSize % 32 !== 0) {
    throw new DataAlignmentError({ size: dataSize });
  }
  const decoded = decodeValues(plan.nodes, plan.params, plan.headSize, data);
  if (checks.dataLength && decoded.end < decoded.length) {
    throw new DataTooLongError({ size: decoded.length, end: decoded.end });
  }
  return decoded;
}

/** Gives a `BaseError` leaving a function decoder the call it comes from. */
export function attachFunctionContext(
  error: unknown,
  context: {
    readonly abi: unknown;
    readonly abiSelector?: Hex | undefined;
    readonly functionName?: string | undefined;
    readonly args?: readonly unknown[] | undefined;
    readonly data: unknown;
    readonly options: DecodeFunctionOptions;
  },
): void {
  if (!(error instanceof BaseError)) return;
  Object.assign(error, {
    ...context,
    data: typeof context.data === "string" ? context.data : undefined,
  });
}
