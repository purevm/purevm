/*
 * viem@2.56.9 `src/utils/abi/decodeFunctionResult.ts`, stateless: the outputs of a function's
 * return data. `abi` is one function or an ABI (its first function, or the one named
 * `functionName`, picked among overloads by `args`); the options add strict checks.
 */
import type { AbiFunction, AbiStateMutability } from "../abi.types.ts";
import { InvalidFunctionInputError } from "./function.errors.ts";
import type { ContractFunctionArgs, ContractFunctionName } from "./function.args.ts";
import { selectResultFunction } from "./function.item.ts";
import { compileFunctionPlan } from "./function.plan.ts";
import {
  assertData,
  attachFunctionContext,
  decodeOutputs,
  resolveFunctionChecks,
} from "./function.read.ts";
import type {
  DecodeFunctionOptions,
  DecodeFunctionResultParameters,
  DecodeFunctionResultReturnType,
  FunctionAbiOf,
} from "./function.types.ts";

export function decodeFunctionResult<
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
  parameters: DecodeFunctionResultParameters<abi, functionName, args>,
): DecodeFunctionResultReturnType<FunctionAbiOf<abi>, functionName, args> {
  let input: ResultInput = {};
  let options: DecodeFunctionOptions = {};
  let fn: AbiFunction | undefined;
  try {
    input = readResultInput(parameters);
    const checks = resolveFunctionChecks(input.options ?? {});
    options = (input.options ?? {}) as DecodeFunctionOptions;
    const { data } = input;
    assertData(data, checks);
    fn = resolveResultFunction(input);
    const plan = compileFunctionPlan(fn, checks.types, checks);
    return decodeOutputs(plan, data, checks) as DecodeFunctionResultReturnType<
      FunctionAbiOf<abi>,
      functionName,
      args
    >;
  } catch (error) {
    attachFunctionContext(error, {
      abi: fn ?? input.abi,
      functionName: input.functionName as string | undefined,
      args: input.args as readonly unknown[] | undefined,
      data: input.data,
      options,
    });
    throw error;
  }
}

export type ResultInput = {
  readonly abi?: unknown;
  readonly args?: unknown;
  readonly data?: unknown;
  readonly functionName?: unknown;
  readonly options?: unknown;
};

/** Checks the shape of the parameters of `decodeFunctionResult` (and its compiled form). */
export function readResultInput(parameters: unknown): ResultInput {
  if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new InvalidFunctionInputError("parameters is not an object");
  }
  const input = parameters as ResultInput;
  if (input.functionName !== undefined && typeof input.functionName !== "string") {
    throw new InvalidFunctionInputError("functionName is not a string");
  }
  if (input.args !== undefined && !Array.isArray(input.args)) {
    throw new InvalidFunctionInputError("args is not an array");
  }
  return input;
}

/** The function decoded: one function is the ABI `[fn]`. */
export function resolveResultFunction(input: ResultInput): AbiFunction {
  const abi = Array.isArray(input.abi) ? input.abi : [input.abi];
  return selectResultFunction(
    abi,
    input.functionName as string | undefined,
    input.args as readonly unknown[] | undefined,
  );
}
