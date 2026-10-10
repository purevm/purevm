/*
 * Full textual definition of an event: its name and, for each parameter, its type, `indexed` flag
 * and name, tuple components included, then ` anonymous` when set. Unlike the topic0 signature, it
 * keeps the names, the topics/data split and the anonymous flag (which shifts indexed parameters to
 * `topics[0]`), so two definitions that decode to different arguments give different text.
 * Type aliases (`uint`, `byte`, ...) are normalized so that equivalent encodings give the same text.
 * `internalType` is left out: it never changes the encoding.
 * `hashEventDefinition` is the keccak256 of that text, to use as an identifier of the definition.
 */
import { keccak256 } from "../libs/keccak.ts";
import type { AbiEvent, AbiEventParameter, AbiParameter, Hex } from "../abi.types.ts";
import { InvalidAbiTypeError } from "../errors.validation.ts";
import { InvalidAbiEventError } from "./log.errors.ts";

// ================================================================
// Constants
// ================================================================

// Names and types must not contain the separators of the output, or two ABIs could share a text.
const identifier = /^[A-Za-z_$][\w$]*$/;
// Array sizes are empty (dynamic) or a positive integer without leading zero.
const arraySuffix = /^(?:\[(?:[1-9]\d*)?\])*$/;
// Base type then array suffix. Size M has no leading zero; decimals N (fixed/ufixed) are 0 or have none.
const elementaryType = /^([a-z]+(?:[1-9]\d*(?:x(?:0|[1-9]\d*))?)?)((?:\[(?:[1-9]\d*)?\])*)$/;
// A Map, not an object literal: a lookup on "constructor" or "toString" would hit the prototype.
const typeAliases = new Map([
  ["uint", "uint256"],
  ["int", "int256"],
  ["byte", "bytes1"],
  ["fixed", "fixed128x18"],
  ["ufixed", "ufixed128x18"],
]);
const textEncoder = new TextEncoder();
const tupleType = "tuple";

// ================================================================
// Functions
// ================================================================

/**
 * @example
 * hashEventDefinition(transfer)
 * 0x50bd07186f6e0a1322defa35da222ed517e716d99767f47ba398a4ed0f64100f
 */
export function hashEventDefinition(event: AbiEvent): Hex {
  const formattedEvent = formatEventDefinition(event);
  return keccak256(textEncoder.encode(formattedEvent));
}

/**
 * Returns the canonical ABI representation used by catalogs. Fields that are equivalent when
 * omitted are made explicit, compiler-only `internalType` is removed, and elementary aliases are
 * expanded recursively. Consequently, ABIs that have the same definition hash also have the same
 * normalized object (apart from a theoretical keccak collision).
 */
export function normalizeEventDefinition(event: AbiEvent): AbiEvent {
  // Formatting first validates the complete event, including names and tuple components.
  formatEventDefinition(event);
  return {
    type: "event",
    name: event.name,
    anonymous: event.anonymous === true,
    inputs: event.inputs.map(normalizeEventParameter),
  };
}

/**
 * @example
 * formatEventDefinition(transfer)
 * "Transfer(address indexed from,address indexed to,uint256 value)"
 */
export function formatEventDefinition(event: AbiEvent): string {
  const { name, inputs } = event;
  if (typeof name !== "string" || !identifier.test(name)) {
    throw new InvalidAbiEventError(`event name ${JSON.stringify(name)} is not an identifier`);
  }
  if (!Array.isArray(inputs)) {
    throw new InvalidAbiEventError('"inputs" is not an array');
  }
  const formattedInputs = inputs.map((param) => formatParameter(param, true));
  return `${name}(${formattedInputs.join(",")})${event.anonymous === true ? " anonymous" : ""}`;
}

// ================================================================
// Utility functions
// ================================================================

function formatParameter(param: AbiEventParameter, topLevel: boolean): string {
  // The ABI may come from untrusted JSON.
  if (typeof param !== "object" || param === null) {
    throw new InvalidAbiEventError(`parameter ${JSON.stringify(param)} is not an object`);
  }
  const { name } = param;
  const hasName = name !== undefined && name !== "";
  if (hasName) {
    if (typeof name !== "string" || !identifier.test(name)) {
      throw new InvalidAbiEventError(`parameter name ${JSON.stringify(name)} is not an identifier`);
    }
    // `uint256 indexed` would otherwise read the same with or without a parameter named `indexed`.
    if (name === "indexed") {
      throw new InvalidAbiEventError(`parameter name "indexed" is ambiguous`);
    }
  }

  let text = formatType(param);
  if (topLevel && param.indexed === true) {
    text += " indexed";
  }
  if (hasName) {
    text += ` ${name}`;
  }
  return text;
}

function formatType(param: AbiParameter): string {
  const { type } = param;
  if (typeof type !== "string") {
    throw new InvalidAbiEventError(`parameter type ${JSON.stringify(type)} is not a string`);
  }

  if (!type.startsWith(tupleType)) {
    const match = elementaryType.exec(type);
    if (match === null) {
      throw new InvalidAbiTypeError(type);
    }
    const [, base = "", suffix = ""] = match;
    return `${typeAliases.get(base) ?? base}${suffix}`;
  }

  const suffix = type.slice(tupleType.length);
  if (!arraySuffix.test(suffix)) {
    throw new InvalidAbiTypeError(type);
  }

  const { components } = param;
  if (!Array.isArray(components) || components.length === 0) {
    throw new InvalidAbiEventError(`${JSON.stringify(type)} has no components`);
  }
  const formattedComponents = components.map((component) => formatParameter(component, false));
  return `(${formattedComponents.join(",")})${suffix}`;
}

function normalizeEventParameter(param: AbiEventParameter): AbiEventParameter {
  return {
    name: param.name ?? "",
    type: normalizeType(param),
    indexed: param.indexed === true,
    ...(param.components === undefined
      ? {}
      : { components: param.components.map(normalizeParameter) }),
  };
}

function normalizeParameter(param: AbiParameter): AbiParameter {
  return {
    name: param.name ?? "",
    type: normalizeType(param),
    ...(param.components === undefined
      ? {}
      : { components: param.components.map(normalizeParameter) }),
  };
}

function normalizeType(param: AbiParameter): string {
  const { type } = param;
  if (!type.startsWith(tupleType)) {
    const match = elementaryType.exec(type);
    if (match === null) throw new InvalidAbiTypeError(type);
    const [, base = "", suffix = ""] = match;
    return `${typeAliases.get(base) ?? base}${suffix}`;
  }
  return type;
}
