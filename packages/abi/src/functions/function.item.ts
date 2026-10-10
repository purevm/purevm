/*
 * viem@2.56.9 `src/utils/abi/getAbiItem.ts`: finds an ABI item by name (or selector), and picks the
 * overload whose inputs match `args`, throwing when two overloads cannot be told apart.
 */
import { formatAbiItem, toEventSelector, toFunctionSelector } from "../abi.signature.ts";
import type { AbiFunction, AbiParameter } from "../abi.types.ts";
import { AbiFunctionNotFoundError, AbiItemAmbiguityError } from "./function.errors.ts";
import { assertFunctionShape } from "./function.plan.ts";

type Item = {
  readonly type?: unknown;
  readonly name?: unknown;
  readonly inputs?: readonly AbiParameter[] | undefined;
};

/** viem's `isAddress(value, { strict: false })`. */
const isAddress = (value: unknown): boolean => /^0x[a-fA-F0-9]{40}$/.test(value as string);

/** The selector of a function or event item, from its name and input types. */
const selectorOf = (item: Item, kind: "function" | "event"): string => {
  const definition = formatAbiItem({ name: String(item.name), inputs: item.inputs ?? [] });
  return kind === "function" ? toFunctionSelector(definition) : toEventSelector(definition);
};

/**
 * The item of `abi` named `name` (or whose selector is `name`, when it starts with `0x`); among
 * overloads, the one whose inputs match `args`, else the first. `undefined` when none has it.
 */
export function getAbiItem(
  abi: readonly unknown[],
  name: string,
  args: readonly unknown[] = [],
): Item | undefined {
  const isSelector = name.startsWith("0x");
  const abiItems = abi.filter((value): value is Item => {
    if (value === null || typeof value !== "object") return false;
    const item = value as Item;
    if (isSelector) {
      if (item.type === "function") return selectorOf(item, "function") === name;
      if (item.type === "event") return selectorOf(item, "event") === name;
      return false;
    }
    return "name" in item && item.name === name;
  });

  if (abiItems.length === 0) return undefined;
  if (abiItems.length === 1) return abiItems[0];

  let matchedAbiItem: Item | undefined;
  for (const abiItem of abiItems) {
    if (!("inputs" in abiItem)) continue;
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0) return abiItem;
      continue;
    }
    if (!abiItem.inputs) continue;
    if (abiItem.inputs.length === 0) continue;
    if (abiItem.inputs.length !== args.length) continue;
    const inputs = abiItem.inputs;
    const matched = args.every((arg, index) => {
      const abiParameter = inputs[index];
      if (!abiParameter) return false;
      return isArgOfType(arg, abiParameter);
    });
    if (!matched) continue;
    // Check for ambiguity against already matched parameters (e.g. `address` vs `bytes20`).
    if (matchedAbiItem?.inputs) {
      const ambiguousTypes = getAmbiguousTypes(abiItem.inputs, matchedAbiItem.inputs, args);
      if (ambiguousTypes) {
        throw new AbiItemAmbiguityError(
          { abiItem: named(abiItem), type: ambiguousTypes[0]! },
          { abiItem: named(matchedAbiItem), type: ambiguousTypes[1]! },
        );
      }
    }
    matchedAbiItem = abiItem;
  }

  return matchedAbiItem ?? abiItems[0];
}

const named = (item: Item) => ({ name: String(item.name), inputs: item.inputs ?? [] });

/** Whether `arg` can be a value of `abiParameter`, from its JavaScript type. */
export function isArgOfType(arg: unknown, abiParameter: AbiParameter): boolean {
  const argType = typeof arg;
  const abiParameterType = abiParameter.type;
  switch (abiParameterType) {
    case "address":
      return isAddress(arg);
    case "bool":
      return argType === "boolean";
    case "function":
      return argType === "string";
    case "string":
      return argType === "string";
    default: {
      if (abiParameterType === "tuple" && "components" in abiParameter) {
        return Object.values(abiParameter.components ?? []).every(
          (component, index) =>
            argType === "object" &&
            isArgOfType(Object.values(arg as object)[index], component as AbiParameter),
        );
      }

      // `(u)int<M>`: (un)signed integer type of `M` bits, `0 < M <= 256`, `M % 8 == 0`
      if (
        /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(
          abiParameterType,
        )
      ) {
        return argType === "number" || argType === "bigint";
      }

      // `bytes<M>`: binary type of `M` bytes, `0 < M <= 32`
      if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType)) {
        return argType === "string" || arg instanceof Uint8Array;
      }

      // fixed-length (`<type>[M]`) and dynamic (`<type>[]`) arrays
      if (/[a-z]+[1-9]{0,3}(\[[0-9]{0,}\])+$/.test(abiParameterType)) {
        return (
          Array.isArray(arg) &&
          arg.every((x: unknown) =>
            isArgOfType(x, {
              ...abiParameter,
              // Pop off `[]` or `[M]` from end of type
              type: abiParameterType.replace(/(\[[0-9]{0,}\])$/, ""),
            } as AbiParameter),
          )
        );
      }

      return false;
    }
  }
}

/** The first pair of types of the two overloads that `args` cannot tell apart, if any. */
export function getAmbiguousTypes(
  sourceParameters: readonly AbiParameter[],
  targetParameters: readonly AbiParameter[],
  args: readonly unknown[],
): string[] | undefined {
  for (const parameterIndex in sourceParameters) {
    const sourceParameter = sourceParameters[parameterIndex as unknown as number];
    const targetParameter = targetParameters[parameterIndex as unknown as number];
    if (sourceParameter === undefined || targetParameter === undefined) continue;

    if (
      sourceParameter.type === "tuple" &&
      targetParameter.type === "tuple" &&
      "components" in sourceParameter &&
      "components" in targetParameter
    ) {
      return getAmbiguousTypes(
        sourceParameter.components ?? [],
        targetParameter.components ?? [],
        ((args as unknown as Record<string, unknown>)[parameterIndex] ?? []) as readonly unknown[],
      );
    }

    const types = [sourceParameter.type, targetParameter.type];
    const arg = args[parameterIndex as unknown as number];
    const ambiguous =
      (types.includes("address") && types.includes("bytes20")) ||
      (types.includes("address") && types.includes("string") && isAddress(arg)) ||
      (types.includes("address") && types.includes("bytes") && isAddress(arg));

    if (ambiguous) return types;
  }
  return undefined;
}

/**
 * viem's `decodeFunctionResult` selection: the ABI's first item, or the one named `functionName`
 * (picked among overloads by `args`); it must be a function.
 */
export function selectResultFunction(
  abi: readonly unknown[],
  functionName: string | undefined,
  args: readonly unknown[] | undefined,
): AbiFunction {
  let abiItem: unknown = abi[0];
  if (functionName) {
    const item = getAbiItem(abi, functionName, args);
    if (!item) {
      throw new AbiFunctionNotFoundError(functionName);
    }
    abiItem = item;
  }
  if ((abiItem as Item | undefined)?.type !== "function") {
    throw new AbiFunctionNotFoundError(undefined);
  }
  assertFunctionShape(abiItem);
  return abiItem;
}
