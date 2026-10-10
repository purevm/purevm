/*
 * viem@2.56.9 `src/utils/abi/decodeFunctionData.ts`, stateless: the function of the calldata
 * selector and its arguments. `abi` is one function (its selector is still checked) or an ABI; the
 * options add strict checks, all enabled by default.
 */
import type { AbiFunction, Hex } from "../abi.types.ts";
import { assertHex } from "../decode.options.ts";
import {
  AbiFunctionNameMismatchError,
  AbiFunctionSignatureNotFoundError,
  InvalidAbiFunctionError,
  InvalidFunctionInputError,
} from "./function.errors.ts";
import type { ContractFunctionName } from "./function.args.ts";
import {
  assertFunctionShape,
  compileFunctionPlan,
  findFunction,
  functionSelectorOf,
} from "./function.plan.ts";
import {
  assertData,
  attachFunctionContext,
  decodeArguments,
  readSelector,
  resolveFunctionChecks,
} from "./function.read.ts";
import type {
  DecodeFunctionDataParameters,
  DecodeFunctionDataReturnType,
  DecodeFunctionOptions,
  FunctionAbiOf,
} from "./function.types.ts";

export function decodeFunctionData<
  const abi extends AbiFunction | readonly unknown[],
  const functionName extends ContractFunctionName<FunctionAbiOf<abi>> | undefined = undefined,
>(
  parameters: DecodeFunctionDataParameters<abi, functionName>,
): DecodeFunctionDataReturnType<FunctionAbiOf<abi>, functionName> {
  let input: {
    readonly abi?: unknown;
    readonly abiSelector?: unknown;
    readonly data?: unknown;
    readonly functionName?: unknown;
    readonly options?: unknown;
  } = {};
  let options: DecodeFunctionOptions = {};
  let fn: AbiFunction | undefined;
  try {
    if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
      throw new InvalidFunctionInputError("parameters is not an object");
    }
    input = parameters as typeof input;
    const checks = resolveFunctionChecks(input.options ?? {});
    options = (input.options ?? {}) as DecodeFunctionOptions;
    const { abi, abiSelector, data, functionName } = input;
    if (abiSelector !== undefined) {
      if (typeof abiSelector !== "string") {
        throw new InvalidFunctionInputError("abiSelector is not a string");
      }
      if (checks.hex) {
        assertHex(abiSelector, "abiSelector");
      }
    }
    if (functionName !== undefined && typeof functionName !== "string") {
      throw new InvalidFunctionInputError("functionName is not a string");
    }
    if (Array.isArray(abi) && abiSelector !== undefined) {
      throw new InvalidAbiFunctionError("abiSelector can only be supplied with one function");
    }
    assertData(data, checks);
    const selector = readSelector(data, checks);

    if (Array.isArray(abi)) {
      fn = findFunction(abi, selector);
    } else {
      assertFunctionShape(abi);
      if (selector !== ((abiSelector as Hex | undefined) ?? functionSelectorOf(abi))) {
        throw new AbiFunctionSignatureNotFoundError(selector);
      }
      fn = abi;
    }
    if (functionName !== undefined && fn.name !== functionName) {
      throw new AbiFunctionNameMismatchError({ expected: functionName, actual: fn.name });
    }

    const plan = compileFunctionPlan(fn, checks.types, checks);
    return {
      functionName: fn.name,
      args: decodeArguments(plan, data, checks),
    } as DecodeFunctionDataReturnType<FunctionAbiOf<abi>, functionName>;
  } catch (error) {
    attachFunctionContext(error, {
      abi: fn ?? input.abi,
      abiSelector: input.abiSelector as Hex | undefined,
      functionName: input.functionName as string | undefined,
      data: input.data,
      options,
    });
    throw error;
  }
}
