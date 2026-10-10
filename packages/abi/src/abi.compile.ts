/* Compiles ABI parameters into immutable reader nodes. */
import { arrayNode, tupleNode } from "./abi.composites.ts";
import type { Node, ReaderOptions } from "./abi.nodes.ts";
import { addressNode, boolNode, byteTailNode, fixedBytesNode, numberNode } from "./abi.scalars.ts";
import type { AbiParameter } from "./abi.types.ts";
import { InvalidAbiTypeError } from "./errors.validation.ts";
import { InvalidAbiDecodingTypeError } from "./errors.viem.ts";

const ABI_NESTING_DEPTH_LIMIT = 128;

/** `T[]` → `[null, "T"]`, `T[3]` → `[3, "T"]`, anything else → `undefined`. */
function getArrayComponents(
  type: string,
): readonly [length: number | null, innerType: string] | undefined {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  if (!matches) return undefined;
  const innerType = matches[1];
  if (innerType === undefined) return undefined;
  return [matches[2] ? Number(matches[2]) : null, innerType];
}

/** Compiles `param` into an immutable reader node. */
export function compileParameter(param: AbiParameter, options: ReaderOptions): Node {
  return compileParameterAtDepth(param, options, 0);
}

function compileParameterAtDepth(param: AbiParameter, options: ReaderOptions, depth: number): Node {
  const { type } = param;
  if (depth > ABI_NESTING_DEPTH_LIMIT) {
    throw new InvalidAbiTypeError(type);
  }
  const array = getArrayComponents(type);
  if (array) {
    return arrayNode(
      compileParameterAtDepth({ ...param, type: array[1] }, options, depth + 1),
      array[0],
      type,
      options.canonicalOffsets,
    );
  }
  if (type === "tuple") {
    const components = param.components ?? [];
    return tupleNode(
      components.map((component) => compileParameterAtDepth(component, options, depth + 1)),
      components.map((component) => component.name),
      type,
      options.canonicalOffsets,
    );
  }
  if (type === "address") {
    return addressNode(type, options.padding, options.addressFormat);
  }
  if (type === "bool") return boolNode();
  if (type.startsWith("bytes")) {
    const [, size] = type.split("bytes");
    return size
      ? fixedBytesNode(type, Number.parseInt(size, 10), options.padding)
      : byteTailNode(type, false, options.padding, options.canonicalOffsets);
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    return numberNode(type, options.padding);
  }
  if (type === "string") {
    return byteTailNode(type, true, options.padding, options.canonicalOffsets);
  }
  // Unknown type: thrown when read, like viem, so that earlier errors come first.
  return {
    dynamic: false,
    size: 32,
    read: () => {
      throw new InvalidAbiDecodingTypeError(type);
    },
  };
}
