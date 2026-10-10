/* Event and function signature formatting, normalization and selector calculation. */
import { InvalidAbiSignatureError } from "./errors.encoding.ts";
import type { AbiParameter, Hex } from "./abi.types.ts";
import { keccak256 } from "./libs/keccak.ts";

const textEncoder = new TextEncoder();

/** `Transfer(address,address,uint256)`, or `Transfer(address from, …)` with `includeName`. */
export function formatAbiItem(
  abiItem: { readonly name: string; readonly inputs: readonly AbiParameter[] },
  { includeName = false }: { includeName?: boolean | undefined } = {},
): string {
  return `${abiItem.name}(${formatAbiParams(abiItem.inputs, includeName)})`;
}

function formatAbiParams(
  params: readonly AbiParameter[] | undefined,
  includeName: boolean,
): string {
  if (!params) return "";
  return params.map((param) => formatAbiParam(param, includeName)).join(includeName ? ", " : ",");
}

function formatAbiParam(param: AbiParameter, includeName: boolean): string {
  if (param.type.startsWith("tuple")) {
    return `(${formatAbiParams(param.components, includeName)})${param.type.slice("tuple".length)}`;
  }
  return param.type + (includeName && param.name ? ` ${param.name}` : "");
}

/**
 * Returns the event selector for a given event definition.
 *
 * @example
 * const selector = toEventSelector('Transfer(address indexed from, address indexed to, uint256 amount)')
 * // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 */
export function toEventSelector(definition: string): Hex {
  return keccak256(textEncoder.encode(normalizeSignature(definition)));
}

/**
 * Returns the function selector for a given function definition: the first 4 bytes of the hash of
 * its normalized signature.
 *
 * @example
 * const selector = toFunctionSelector('transfer(address,uint256)')
 * // 0xa9059cbb
 */
export function toFunctionSelector(definition: string): Hex {
  return toEventSelector(definition).slice(0, 10) as Hex;
}

/**
 * Keeps the name and the parameter types: drops an `event`/`function` keyword, parameter names
 * and anything after the closing parenthesis. Changes the output of `formatAbiItem` only when the
 * ABI's names or types contain spaces or parentheses.
 */
function normalizeSignature(signature: string): string {
  let active = true;
  let current = "";
  let level = 0;
  let result = "";
  let valid = false;

  for (let i = 0; i < signature.length; i++) {
    const char = signature.charAt(i);

    // If the character is a separator, we want to reactivate.
    if (char === "(" || char === ")" || char === ",") {
      active = true;
    }

    // If the character is a "level" token, we want to increment/decrement.
    if (char === "(") {
      level++;
    }
    if (char === ")") {
      level--;
    }

    // If we aren't active, we don't want to mutate the result.
    if (!active) continue;

    // If level === 0, we are at the definition level.
    if (level === 0) {
      if (char === " " && (result === "event" || result === "function" || result === "")) {
        result = "";
      } else {
        result += char;

        // If we are at the end of the definition, we must be finished.
        if (char === ")") {
          valid = true;
          break;
        }
      }

      continue;
    }

    // Ignore spaces
    if (char === " ") {
      // If the previous character is a separator, and the current section isn't empty, we want to deactivate.
      if (signature[i - 1] !== "," && current !== "," && current !== ",(") {
        current = "";
        active = false;
      }
      continue;
    }

    result += char;
    current += char;
  }

  if (!valid) {
    throw new InvalidAbiSignatureError(signature);
  }

  return result;
}
