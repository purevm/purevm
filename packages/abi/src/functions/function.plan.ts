/*
 * Stateless compilation of a function into the immutable plan used by its decoders: compiled
 * readers for its inputs (calldata) and its outputs (return data).
 */
import { compileParameter } from "../abi.compile.ts";
import { safeAddSize, type Node, type ReaderOptions } from "../abi.nodes.ts";
import { formatAbiItem, toFunctionSelector } from "../abi.signature.ts";
import type { AbiFunction, AbiParameter, Hex } from "../abi.types.ts";
import { assertParameterShape, validateParameterType } from "../abi.validate.ts";
import { AbiFunctionSignatureNotFoundError, InvalidAbiFunctionError } from "./function.errors.ts";

/** Compiled readers of a parameter list, decoded as one top-level tuple. */
export type ParameterPlan = {
  readonly params: readonly AbiParameter[];
  readonly nodes: readonly Node[];
  readonly headSize: number;
};

export type FunctionPlan = {
  readonly fn: AbiFunction;
  readonly functionName: string;
  readonly inputs: ParameterPlan;
  /** `undefined` when the ABI declares no `outputs` (viem's `AbiFunctionOutputsNotFoundError`). */
  readonly outputs: ParameterPlan | undefined;
};

const invalidFunction = (reason: string): InvalidAbiFunctionError =>
  new InvalidAbiFunctionError(reason);

/**
 * Checks the minimum shape needed to safely format and compile a function. Like viem, missing
 * `inputs` mean none, and missing `outputs` only fail when the result is decoded.
 */
export function assertFunctionShape(value: unknown): asserts value is AbiFunction {
  if (value === null || typeof value !== "object") {
    throw invalidFunction("the value is not an object");
  }
  const fn = value as Partial<AbiFunction>;
  if (fn.type !== "function") {
    throw invalidFunction('"type" is not "function"');
  }
  if (typeof fn.name !== "string") {
    throw invalidFunction('"name" is not a string');
  }
  for (const key of ["inputs", "outputs"] as const) {
    const params: unknown = fn[key];
    if (params === undefined) continue;
    if (!Array.isArray(params)) {
      throw invalidFunction(`"${key}" is not an array`);
    }
    for (let index = 0; index < params.length; index++) {
      assertParameterShape(params[index], `${key}[${index}]`, 0, invalidFunction);
    }
  }
}

/** `validateTypes`: supported canonical types in both the inputs and the outputs. */
function validateFunctionTypes(fn: AbiFunction): void {
  for (const key of ["inputs", "outputs"] as const) {
    const params = fn[key] ?? [];
    for (let index = 0; index < params.length; index++) {
      const param = params[index];
      if (param === undefined) continue;
      if ((param as { readonly indexed?: unknown }).indexed !== undefined) {
        throw invalidFunction(`${key}[${index}].indexed is not allowed`);
      }
      validateParameterType(param, `${key}[${index}]`, invalidFunction);
    }
  }
}

function compileParameters(
  params: readonly AbiParameter[],
  readerOptions: ReaderOptions,
): ParameterPlan {
  const nodes: Node[] = [];
  let headSize = 0;
  for (const param of params) {
    const node = compileParameter(param, readerOptions);
    nodes.push(node);
    headSize = safeAddSize(headSize, node.size);
  }
  return { params, nodes, headSize };
}

/** Compiles a function whose structure has already been checked by the caller. */
export function compileFunctionPlan(
  fn: AbiFunction,
  validateTypes: boolean,
  readerOptions: ReaderOptions,
): FunctionPlan {
  if (validateTypes) {
    validateFunctionTypes(fn);
  }
  return {
    fn,
    functionName: fn.name,
    inputs: compileParameters(fn.inputs ?? [], readerOptions),
    outputs: fn.outputs === undefined ? undefined : compileParameters(fn.outputs, readerOptions),
  };
}

/** The 4-byte selector of `fn`. */
export function functionSelectorOf(fn: AbiFunction): Hex {
  return toFunctionSelector(formatAbiItem({ name: fn.name, inputs: fn.inputs ?? [] }));
}

/** Stateless equivalent of viem's ordered `abi.find` on function selectors. */
export function findFunction(abi: readonly unknown[], selector: Hex): AbiFunction {
  for (const item of abi) {
    if (item === null || typeof item !== "object") continue;
    if ((item as { readonly type?: unknown }).type !== "function") continue;
    assertFunctionShape(item);
    if (functionSelectorOf(item) === selector) return item;
  }
  throw new AbiFunctionSignatureNotFoundError(selector);
}

/** A detached function for a compiled decoder: later mutations cannot change its plan or errors. */
export function snapshotFunction(value: unknown): AbiFunction {
  assertFunctionShape(value);
  const snapshot = {
    type: "function",
    name: value.name,
    stateMutability: value.stateMutability,
    inputs: Object.freeze((value.inputs ?? []).map(cloneParameter)),
    ...(value.outputs === undefined
      ? {}
      : { outputs: Object.freeze(value.outputs.map(cloneParameter)) }),
  };
  return Object.freeze(snapshot) as AbiFunction;
}

function cloneParameter(param: AbiParameter): AbiParameter {
  const { components } = param;
  const clone = {
    type: param.type,
    ...(param.name === undefined ? {} : { name: param.name }),
    ...(param.internalType === undefined ? {} : { internalType: param.internalType }),
    ...(components === undefined
      ? {}
      : { components: Object.freeze(components.map(cloneParameter)) }),
  } satisfies AbiParameter;
  return Object.freeze(clone);
}
