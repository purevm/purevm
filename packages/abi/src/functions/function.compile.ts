/*
 * Explicit compilation of function decoders: everything that depends only on the ABI (snapshots,
 * selectors, plans, the selector table, the overload resolution) is done once here and kept by
 * the returned function; nothing is cached anywhere else.
 */
import type { AbiFunction, AbiStateMutability, Hex } from "../abi.types.ts";
import { assertHex } from "../decode.options.ts";
import {
  AbiFunctionSignatureNotFoundError,
  InvalidAbiFunctionError,
  InvalidFunctionInputError,
} from "./function.errors.ts";
import type { ContractFunctionArgs, ContractFunctionName } from "./function.args.ts";
import {
  compileFunctionPlan,
  functionSelectorOf,
  snapshotFunction,
  type FunctionPlan,
} from "./function.plan.ts";
import {
  assertData,
  attachFunctionContext,
  decodeArguments,
  decodeOutputs,
  readSelector,
  resolveFunctionChecks,
  type FunctionChecks,
} from "./function.read.ts";
import { readResultInput, resolveResultFunction } from "./function.result.ts";
import type {
  CompileFunctionDataDecoderParameters,
  CompileFunctionResultDecoderParameters,
  DecodeFunctionOptions,
  FunctionAbiOf,
  FunctionDataDecoder,
  FunctionResultDecoder,
} from "./function.types.ts";

/** Gives a compiled decoder its read-only properties. */
function describe<decoder>(decode: (data: unknown) => unknown, properties: object): decoder {
  const descriptors: PropertyDescriptorMap = {};
  for (const [key, value] of Object.entries(properties)) {
    descriptors[key] = { value, enumerable: true };
  }
  return Object.defineProperties(decode, descriptors) as decoder;
}

/** Compiles a calldata decoder for one function, or for every function of an ABI. */
export function compileFunctionDataDecoder<const abi extends AbiFunction | readonly unknown[]>(
  parameters: CompileFunctionDataDecoderParameters<abi>,
): FunctionDataDecoder<abi> {
  let input: {
    readonly abi?: unknown;
    readonly abiSelector?: unknown;
    readonly options?: unknown;
  } = {};
  let options: Readonly<DecodeFunctionOptions> = Object.freeze({});
  try {
    if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
      throw new InvalidFunctionInputError("parameters is not an object");
    }
    input = parameters as typeof input;
    const checks = resolveFunctionChecks(input.options ?? {});
    options = Object.freeze({ ...(input.options as DecodeFunctionOptions | undefined) });
    const { abiSelector } = input;
    if (abiSelector !== undefined) {
      if (typeof abiSelector !== "string") {
        throw new InvalidFunctionInputError("abiSelector is not a string");
      }
      if (checks.hex) {
        assertHex(abiSelector, "abiSelector");
      }
    }
    const decoder = Array.isArray(input.abi)
      ? compileAbiDataDecoder(input.abi, abiSelector as Hex | undefined, checks, options)
      : compileOneDataDecoder(input.abi, abiSelector as Hex | undefined, checks, options);
    return decoder as FunctionDataDecoder<abi>;
  } catch (error) {
    attachFunctionContext(error, {
      abi: input.abi,
      abiSelector: input.abiSelector as Hex | undefined,
      data: undefined,
      options,
    });
    throw error;
  }
}

/** One function: the calldata selector must be `abiSelector`, or its own. */
function compileOneDataDecoder(
  abi: unknown,
  abiSelector: Hex | undefined,
  checks: FunctionChecks,
  options: Readonly<DecodeFunctionOptions>,
): unknown {
  const fn = snapshotFunction(abi);
  const plan = compileFunctionPlan(fn, checks.types, checks);
  const expected = abiSelector ?? functionSelectorOf(fn);
  const decode = (data: unknown) => {
    try {
      assertData(data, checks);
      const selector = readSelector(data, checks);
      if (selector !== expected) {
        throw new AbiFunctionSignatureNotFoundError(selector);
      }
      return { functionName: fn.name, args: decodeArguments(plan, data, checks) };
    } catch (error) {
      attachFunctionContext(error, { abi: fn, abiSelector: expected, data, options });
      throw error;
    }
  };
  return describe(decode, { abi: fn, abiSelector: expected, options });
}

/**
 * An ABI: every function is snapshotted and compiled now, and indexed by its selector. When two
 * functions share a selector, the first wins, like viem's `abi.find`. Other items are ignored.
 */
function compileAbiDataDecoder(
  abi: readonly unknown[],
  abiSelector: Hex | undefined,
  checks: FunctionChecks,
  options: Readonly<DecodeFunctionOptions>,
): unknown {
  if (abiSelector !== undefined) {
    throw new InvalidAbiFunctionError("abiSelector can only be supplied with one function");
  }
  const functions: AbiFunction[] = [];
  const plans = new Map<Hex, FunctionPlan>();
  for (const item of abi) {
    if (item === null || typeof item !== "object") continue;
    if ((item as { readonly type?: unknown }).type !== "function") continue;
    const fn = snapshotFunction(item);
    functions.push(fn);
    const selector = functionSelectorOf(fn);
    if (!plans.has(selector)) {
      plans.set(selector, compileFunctionPlan(fn, checks.types, checks));
    }
  }
  const frozen = Object.freeze(functions);

  const decode = (data: unknown) => {
    let selected: AbiFunction | undefined;
    try {
      assertData(data, checks);
      const selector = readSelector(data, checks);
      const plan = plans.get(selector);
      if (plan === undefined) {
        throw new AbiFunctionSignatureNotFoundError(selector);
      }
      selected = plan.fn;
      return { functionName: plan.functionName, args: decodeArguments(plan, data, checks) };
    } catch (error) {
      attachFunctionContext(error, { abi: selected ?? frozen, data, options });
      throw error;
    }
  };
  return describe(decode, { abi: frozen, abiSelector: undefined, options });
}

/**
 * Compiles a return data decoder for the function `decodeFunctionResult` would pick (the first one,
 * or the one named `functionName`, chosen among overloads by `args`), resolved once.
 */
export function compileFunctionResultDecoder<
  const abi extends AbiFunction | readonly unknown[],
  functionName extends ContractFunctionName<FunctionAbiOf<abi>> | undefined = undefined,
  const args extends ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    functionName extends ContractFunctionName<FunctionAbiOf<abi>>
      ? functionName
      : ContractFunctionName<FunctionAbiOf<abi>>
  > = ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    functionName extends ContractFunctionName<FunctionAbiOf<abi>>
      ? functionName
      : ContractFunctionName<FunctionAbiOf<abi>>
  >,
>(
  parameters: CompileFunctionResultDecoderParameters<abi, functionName, args>,
): FunctionResultDecoder<abi, functionName, args> {
  let input: ReturnType<typeof readResultInput> = {};
  let options: Readonly<DecodeFunctionOptions> = Object.freeze({});
  try {
    input = readResultInput(parameters);
    const checks = resolveFunctionChecks(input.options ?? {});
    options = Object.freeze({ ...(input.options as DecodeFunctionOptions | undefined) });
    const fn = snapshotFunction(resolveResultFunction(input));
    const plan = compileFunctionPlan(fn, checks.types, checks);
    const decode = (data: unknown) => {
      try {
        assertData(data, checks);
        return decodeOutputs(plan, data, checks);
      } catch (error) {
        attachFunctionContext(error, { abi: fn, functionName: fn.name, data, options });
        throw error;
      }
    };
    return describe(decode, { abi: fn, functionName: fn.name, options });
  } catch (error) {
    attachFunctionContext(error, {
      abi: input.abi,
      functionName: input.functionName as string | undefined,
      args: input.args as readonly unknown[] | undefined,
      data: undefined,
      options,
    });
    throw error;
  }
}
