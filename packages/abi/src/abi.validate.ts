/*
 * Validation of ABI parameters shared by events and functions: the shape needed to compile them
 * safely, and (with `validateTypes`) the supported canonical types. `invalid` builds the error
 * of the calling API for a structural problem.
 */
import type { AbiEventParameter, AbiParameter } from "./abi.types.ts";
import type { BaseError } from "./errors.base.ts";
import { InvalidAbiTypeError } from "./errors.validation.ts";

/** Deeper component nesting is rejected before it can exhaust the stack. */
export const ABI_COMPONENT_DEPTH_LIMIT = 128;

export function assertParameterShape(
  value: unknown,
  path: string,
  depth: number,
  invalid: (reason: string) => BaseError,
): asserts value is AbiEventParameter {
  if (depth > ABI_COMPONENT_DEPTH_LIMIT) {
    throw invalid(`parameter nesting exceeds ${ABI_COMPONENT_DEPTH_LIMIT} levels`);
  }
  if (value === null || typeof value !== "object") {
    throw invalid(`${path} is not an object`);
  }
  const param = value as Partial<AbiEventParameter> & { readonly components?: unknown };
  if (typeof param.type !== "string") {
    throw invalid(`${path}.type is not a string`);
  }
  if (param.components !== undefined) {
    if (!Array.isArray(param.components)) {
      throw invalid(`${path}.components is not an array`);
    }
    for (let index = 0; index < param.components.length; index++) {
      assertParameterShape(
        param.components[index],
        `${path}.components[${index}]`,
        depth + 1,
        invalid,
      );
    }
  }
}

export function validateParameterType(
  param: AbiParameter,
  path: string,
  invalid: (reason: string) => BaseError,
): void {
  if (param.name !== undefined && typeof param.name !== "string") {
    throw invalid("a parameter name is not a string");
  }
  if (param.internalType !== undefined && typeof param.internalType !== "string") {
    throw invalid('a parameter "internalType" is not a string');
  }
  let base = param.type;
  while (base.endsWith("]")) {
    const match = /^(.*)\[([^\]]*)\]$/.exec(base);
    if (!match) {
      throw new InvalidAbiTypeError(param.type);
    }
    const innerType = match[1];
    const length = match[2];
    if (innerType === undefined || length === undefined) {
      throw new InvalidAbiTypeError(param.type);
    }
    if (length !== "") {
      if (!/^[1-9]\d*$/.test(length) || BigInt(length) > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new InvalidAbiTypeError(param.type);
      }
    }
    base = innerType;
  }

  if (base === "tuple") {
    const { components } = param;
    if (!components) {
      throw new InvalidAbiTypeError(param.type);
    }
    for (let index = 0; index < components.length; index++) {
      const component = components[index];
      if (component === undefined) continue;
      const indexed = (component as AbiEventParameter).indexed;
      if (indexed !== undefined) {
        throw invalid(`${path}.components[${index}].indexed is not allowed`);
      }
      validateParameterType(component, `${path}.components[${index}]`, invalid);
    }
    return;
  }
  if (param.components !== undefined) {
    throw invalid(`${path}.components is only allowed for tuple types`);
  }
  if (base === "address" || base === "bool" || base === "string" || base === "bytes") {
    return;
  }
  const bytesSize = /^bytes(\d+)$/.exec(base)?.[1];
  if (bytesSize !== undefined && Number(bytesSize) >= 1 && Number(bytesSize) <= 32) {
    return;
  }
  const integer = /^(?:u?int)(\d*)$/.exec(base);
  if (integer) {
    const bitSize = integer[1];
    if (bitSize === undefined) {
      throw new InvalidAbiTypeError(param.type);
    }
    const bits = bitSize === "" ? 256 : Number(bitSize);
    if (bits >= 8 && bits <= 256 && bits % 8 === 0) {
      return;
    }
  }
  throw new InvalidAbiTypeError(param.type);
}
