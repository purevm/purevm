import { expect, test } from "vitest";
// viem is a devDependency: the reference these decoders must match, value for value, error class
// for error class.
import {
  decodeFunctionData as viemDecodeFunctionData,
  decodeFunctionResult as viemDecodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  type AbiFunction,
  type AbiParameter,
  type Hex,
} from "viem";
import { createRandom, randomValue, type Random } from "../../../tests/random.ts";
import { compileFunctionDataDecoder, compileFunctionResultDecoder } from "../function.compile.ts";
import { decodeFunctionData } from "../function.data.ts";
import { decodeFunctionResult } from "../function.result.ts";
import type { DecodeFunctionOptions } from "../function.types.ts";

const tuple = (
  components: AbiParameter[],
  suffix = "",
): { type: string; components: AbiParameter[] } => ({ type: `tuple${suffix}`, components });

const PARAMETERS: AbiParameter[] = [
  ...["uint8", "uint48", "uint56", "uint256", "int8", "int48", "int56", "int256"].map((type) => ({
    name: type,
    type,
  })),
  { name: "addr", type: "address" },
  { name: "flag", type: "bool" },
  { name: "b1", type: "bytes1" },
  { name: "b32", type: "bytes32" },
  { name: "blob", type: "bytes" },
  { name: "text", type: "string" },
  { name: "amounts", type: "uint256[]" },
  { name: "texts", type: "string[]" },
  { name: "triple", type: "uint8[3]" },
  { name: "pair", type: "string[2]" },
  { name: "grid", type: "int16[2][3]" },
  {
    name: "order",
    ...tuple([
      { name: "id", type: "uint256" },
      { name: "memo", type: "string" },
    ]),
  },
  {
    name: "orders",
    ...tuple(
      [
        { name: "maker", type: "address" },
        { name: "payload", type: "bytes" },
      ],
      "[]",
    ),
  },
  { name: "unnamed", ...tuple([{ type: "uint256" }, { type: "string" }]) },
];

/** Every strict check off, addresses checksummed: the decoders must then behave like viem. */
const VIEM: DecodeFunctionOptions = {
  addressFormat: "checksum",
  validateHex: false,
  validateTypes: false,
  validateSelectorSize: false,
  validateDataAlignment: false,
  validateDataLength: false,
  validateCanonicalOffsets: false,
  validatePadding: false,
};

/** The value decoded, or the class of what was thrown. */
const outcome = (decode: () => unknown): unknown => {
  try {
    return { value: decode() };
  } catch (error) {
    let name = error instanceof Error ? error.constructor.name : error;
    // viem throws its BaseError on these utility paths; the port uses dedicated subclasses.
    if (name === "InvalidAbiSignatureError" || name === "InvalidByteSequenceError") {
      name = "BaseError";
    }
    return { error: name };
  }
};

/** Calldata, decoded stateless and compiled, with the ABI and with the function alone. */
const checkData = (fn: AbiFunction, others: readonly unknown[], data: Hex, label: string) => {
  const abi = [...others, fn];
  const expected = outcome(() => viemDecodeFunctionData({ abi, data }));
  const decoders: [string, () => unknown][] = [
    ["ABI", () => decodeFunctionData({ abi, data, options: VIEM })],
    ["function", () => decodeFunctionData({ abi: fn, data, options: VIEM })],
    ["compiled ABI", () => compileFunctionDataDecoder({ abi, options: VIEM })(data)],
    ["compiled function", () => compileFunctionDataDecoder({ abi: fn, options: VIEM })(data)],
  ];
  for (const [mode, decode] of decoders) {
    expect(outcome(decode), `${label} data (${mode})`).toStrictEqual(expected);
  }
};

/** Return data, decoded stateless and compiled, by name in the ABI and with the function alone. */
const checkResult = (fn: AbiFunction, others: readonly unknown[], data: Hex, label: string) => {
  const abi = [...others, fn];
  const functionName = fn.name;
  const expected = outcome(() => viemDecodeFunctionResult({ abi, functionName, data } as never));
  const decoders: [string, () => unknown][] = [
    ["ABI", () => decodeFunctionResult({ abi, functionName, data, options: VIEM } as never)],
    ["function", () => decodeFunctionResult({ abi: fn, data, options: VIEM } as never)],
    [
      "compiled ABI",
      () => compileFunctionResultDecoder({ abi, functionName, options: VIEM } as never)(data),
    ],
    [
      "compiled function",
      () => compileFunctionResultDecoder({ abi: fn, options: VIEM } as never)(data),
    ],
  ];
  for (const [mode, decode] of decoders) {
    expect(outcome(decode), `${label} result (${mode})`).toStrictEqual(expected);
  }
};

/** Mutations of canonical encoded data that viem may reject or decode differently. */
const mutations = (random: Random, data: Hex): [string, Hex][] => {
  const cut = 2 + 2 * random.int((data.length - 2) / 2 + 1);
  return [
    ["canonical", data],
    ["extra bytes", `${data}${random.hex(1 + random.int(40)).slice(2)}` as Hex],
    [`truncated at ${cut}`, data.slice(0, cut) as Hex],
    ["random", random.hex(random.int(200))],
  ];
};

/** A random function, its canonical calldata and return data, then their mutations. */
const checkRandom = (random: Random, label: string): void => {
  const named = random.int(4) !== 0;
  const params = (count: number, prefix: string) =>
    Array.from({ length: count }, (_, i) => {
      const parameter = PARAMETERS[random.int(PARAMETERS.length)] as AbiParameter;
      return { ...parameter, name: named ? `${prefix}${i}` : "" };
    });
  const fn = {
    type: "function",
    name: `f${random.int(1000)}`,
    stateMutability: "view",
    inputs: params(random.int(5), "in"),
    outputs: params(random.int(4), "out"),
  } as AbiFunction;
  const others = [
    { type: "event", name: "E", inputs: [] },
    { type: "function", name: "other", stateMutability: "view", inputs: [], outputs: [] },
  ];

  const args = fn.inputs.map((input) => randomValue(random, input));
  const calldata = encodeFunctionData({ abi: [fn], functionName: fn.name, args } as never);
  for (const [mutation, data] of mutations(random, calldata)) {
    checkData(fn, others, data, `${label} ${mutation}`);
  }
  checkData(fn, others, calldata.slice(0, 10) as Hex, `${label} selector only`);
  checkData(fn, others, calldata.slice(0, 6) as Hex, `${label} short selector`);

  const values = fn.outputs.map((output) => randomValue(random, output));
  const returnData = encodeAbiParameters(fn.outputs, values);
  for (const [mutation, data] of mutations(random, returnData)) {
    checkResult(fn, others, data, `${label} ${mutation}`);
  }
};

test("random calldata and return data, canonical and mutated, decode like viem", () => {
  for (let seed = 0; seed < 2000; seed++) checkRandom(createRandom(seed), `seed ${seed}`);
});
