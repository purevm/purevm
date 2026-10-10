import { expect, test } from "vitest";
// viem is a devDependency: the reference this port must match, result for result, error for error.
import {
  decodeEventLog as viemDecodeEventLog,
  encodeAbiParameters,
  encodeEventTopics,
  toEventSelector,
  type AbiEvent,
  type AbiParameter,
  type Hex,
} from "viem";
import { formatAbiItem } from "viem/utils";
import { compileEventLogDecoder } from "../log.compile.ts";
import { decodeEventLog } from "../log.decode.ts";
import type { DecodeEventLogOptions } from "../log.types.ts";
import { createRandom, randomValue, type Random } from "../../../tests/random.ts";

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

/**
 * The outcome of one decode: its value, or the class name of what it threw. The port keeps viem's
 * error classes except for viem's direct `BaseError` utility paths, which use dedicated classes.
 */
const outcome = (decode: () => unknown, normalizeDedicatedErrors = false): unknown => {
  try {
    return { value: decode() };
  } catch (error) {
    let name = error instanceof Error ? error.constructor.name : error;
    // viem throws its BaseError directly on these two utility paths. The port deliberately uses
    // dedicated subclasses, while preserving the same message and behavior.
    if (
      normalizeDedicatedErrors &&
      (name === "InvalidAbiSignatureError" || name === "InvalidByteSequenceError")
    ) {
      name = "BaseError";
    }
    return { error: name };
  }
};

/** Projects viem's named objects onto this package's positional tuple contract. */
/** Tuples decode like viem's (an object when all components are named): only the top level is positional. */
const toPositionalValue = (_param: AbiParameter, value: unknown): unknown => value;

const toPositionalResult = (event: AbiEvent, result: unknown): unknown => {
  const decoded = result as { readonly eventName: string; readonly args?: unknown };
  if (decoded.args === undefined) return result;
  const record = decoded.args as Record<string, unknown>;
  return {
    eventName: decoded.eventName,
    args: event.inputs.map((param, index) =>
      toPositionalValue(
        param,
        Array.isArray(decoded.args) ? decoded.args[index] : record[param.name ?? ""],
      ),
    ),
  };
};

/** Every strict check off: the port must then behave exactly like viem. */
const VIEM: DecodeEventLogOptions = {
  addressFormat: "checksum",
  validateHex: false,
  validateTypes: false,
  validateTopicCount: false,
  validateTopicSize: false,
  validateDataAlignment: false,
  validateDataLength: false,
  validateCanonicalOffsets: false,
  validatePadding: false,
};

/**
 * The port, given the ABI and given the event alone, against viem (`strict: true`): same value or
 * same error class.
 */
const check = (
  event: AbiEvent,
  topics: Hex[],
  data: Hex | undefined,
  label: string,
  // Other ABI items, placed before the event.
  others: readonly unknown[] = [],
): void => {
  const log = { topics: topics as [Hex, ...Hex[]], data };
  const expected = outcome(() =>
    toPositionalResult(event, viemDecodeEventLog({ ...log, abi: [...others, event] })),
  );
  expect(
    outcome(() => decodeEventLog({ abi: [...others, event], options: VIEM, payload: log }), true),
    `${label} (ABI)`,
  ).toStrictEqual(expected);
  expect(
    outcome(() => decodeEventLog({ abi: event, options: VIEM, payload: log }), true),
    `${label} (event)`,
  ).toStrictEqual(expected);
  // Compiled once, then decoding: same results, compilation errors included.
  expect(
    outcome(() => compileEventLogDecoder({ abi: [...others, event], options: VIEM })(log), true),
    `${label} (compiled ABI)`,
  ).toStrictEqual(expected);
  expect(
    outcome(() => compileEventLogDecoder({ abi: event, options: VIEM })(log), true),
    `${label} (compiled event)`,
  ).toStrictEqual(expected);
};

/** A random event, its canonical log, then mutations of that log that viem may reject. */
const checkRandom = (random: Random, label: string): void => {
  const named = random.int(4) !== 0;
  const inputs = Array.from({ length: random.int(6) }, (_, i) => {
    const parameter = PARAMETERS[random.int(PARAMETERS.length)] as AbiParameter;
    // viem's encodeEventTopics cannot encode indexed tuples or arrays.
    const topicable = !parameter.type.startsWith("tuple") && !parameter.type.endsWith("]");
    const indexed = topicable && random.int(3) === 0;
    return named ? { ...parameter, name: `p${i}`, indexed } : { ...parameter, name: "", indexed };
  });
  const event: AbiEvent = { type: "event", name: "Sample", inputs };
  const values = inputs.map((input) => randomValue(random, input));

  const topics = encodeEventTopics({
    abi: [event],
    args: named
      ? Object.fromEntries(
          inputs.flatMap((input, i) => (input.indexed ? [[input.name, values[i]]] : [])),
        )
      : inputs.flatMap((input, i) => (input.indexed ? [values[i]] : [])),
  } as never) as Hex[];
  const data = encodeAbiParameters(
    inputs.filter((input) => !input.indexed),
    inputs.flatMap((input, i) => (input.indexed ? [] : [values[i]])),
  );

  check(event, topics, data, `${label} canonical`);
  check(event, topics, undefined, `${label} no data`);
  check(event, topics, "0x", `${label} empty data`);
  check(event, topics.slice(0, -1), data, `${label} missing topic`);
  check(event, topics.slice(0, 1), data, `${label} selector only`);
  check(event, [...topics, random.hex(32)], data, `${label} extra topic`);
  check(
    event,
    topics,
    `${data}${random.hex(1 + random.int(40)).slice(2)}` as Hex,
    `${label} extra`,
  );
  const cut = 2 + 2 * random.int((data.length - 2) / 2 + 1);
  check(event, topics, data.slice(0, cut) as Hex, `${label} truncated at ${cut}`);
  check(event, topics, random.hex(random.int(200)), `${label} random data`);
};

test("random logs, canonical and mutated, decode like viem", () => {
  for (let seed = 0; seed < 2000; seed++) checkRandom(createRandom(seed), `seed ${seed}`);
});

test("errors on topics match viem", () => {
  const event: AbiEvent = {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  };
  check(event, [], "0x", "no topics");
  check(event, [`0x${"00".repeat(32)}`], "0x", "unknown selector");
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Edge cases the random logs never produce

/** One 32-byte word. */
const word = (value: bigint | number): string => BigInt(value).toString(16).padStart(64, "0");

/** The selector viem computes for `event`, through the same formatting as `decodeEventLog`. */
const selectorOf = (event: AbiEvent): Hex => toEventSelector(formatAbiItem(event));

const eventOf = (inputs: AbiEvent["inputs"], name = "Sample"): AbiEvent => ({
  type: "event",
  name,
  inputs,
});

test("abnormal signatures are normalized like viem", () => {
  const value = `0x${word(7)}` as Hex;
  const cases: [string, AbiEvent][] = [
    ["space in a type", eventOf([{ name: "a", type: "uint256 x" }])],
    ["keyword in the name", eventOf([{ name: "a", type: "uint256" }], "event Sample")],
    ["space in the name", eventOf([{ name: "a", type: "uint256" }], "Sam ple")],
    ["extra closing parenthesis", eventOf([{ name: "a", type: "uint256)" }])],
    [
      "spaces inside a tuple",
      eventOf([
        {
          name: "t",
          type: "tuple",
          components: [
            { name: "x", type: "uint256 x" },
            { name: "y", type: "bool y" },
          ],
        },
      ]),
    ],
  ];
  for (const [label, event] of cases) {
    check(event, [selectorOf(event)], `${value}${word(1)}` as Hex, label);
  }
  // No closing parenthesis at the top level: normalization throws while the ABI is searched.
  check(eventOf([{ name: "a", type: "uint256(" }]), [`0x${word(1)}`], value, "unbalanced");
});

test("an ABI with other item kinds finds the event like viem", () => {
  const event = eventOf([
    { name: "from", type: "address", indexed: true },
    { name: "value", type: "uint256" },
  ]);
  const others = [
    { type: "constructor", inputs: [], stateMutability: "nonpayable" },
    { type: "function", name: "Sample", inputs: [], outputs: [], stateMutability: "view" },
    { type: "fallback", stateMutability: "payable" },
    { type: "receive", stateMutability: "payable" },
    { type: "error", name: "Sample", inputs: [] },
  ];
  const topics = [selectorOf(event), `0x${word(0xd8da6bf26964af9d7eed9e03e53415d37aa96045n)}`];
  check(event, topics as Hex[], `0x${word(5)}`, "heterogeneous ABI", others);
});

test("hostile data decodes or fails like viem", () => {
  const text = eventOf([{ name: "text", type: "string" }]);
  const flag = eventOf([{ name: "flag", type: "bool" }]);
  const amounts = eventOf([{ name: "amounts", type: "uint256[]" }]);
  const empties = eventOf([{ name: "empties", type: "uint256[0][]" }]);
  const empty = eventOf([{ name: "empty", type: "uint256[0]" }]);
  const texts = eventOf([{ name: "texts", type: "string[]" }]);
  const indexed = eventOf([{ name: "id", type: "uint256", indexed: true }]);

  const cases: [string, AbiEvent, Hex[] | undefined, string][] = [
    ["offset above 2^53", text, undefined, word(2n ** 60n) + word(0)],
    ["length above 2^53", text, undefined, word(32) + word(2n ** 60n)],
    ["huge dynamic length", amounts, undefined, word(32) + word(2n ** 40n)],
    ["zero-width elements", empties, undefined, word(32) + word(100_000)],
    ["zero-width fixed array", empty, undefined, word(0)],
    // Every element points at the same tail: the re-reads hit the recursive read limit.
    [
      "re-read positions",
      texts,
      undefined,
      word(32) + word(9_000) + word(32).repeat(9_000) + word(0),
    ],
    ["bool with leading zeros", flag, undefined, word(2)],
    ["bool with high bytes", flag, undefined, `ff${word(1).slice(2)}`],
    ["invalid UTF-8", text, undefined, word(32) + word(2) + `fffe${"00".repeat(30)}`],
    ["odd hex length", flag, undefined, `${word(1)}1`],
    ["one hex digit", flag, undefined, "1"],
    ["invalid hex", flag, undefined, `zz${word(1).slice(2)}`],
    ["empty topic", indexed, [selectorOf(indexed), "0x"], word(0)],
    ["short topic", indexed, [selectorOf(indexed), "0x01"], word(0)],
  ];
  for (const [label, event, topics, data] of cases) {
    check(event, topics ?? [selectorOf(event)], `0x${data}` as Hex, label);
  }
  // `data` is typed as hex but not checked: a string without `0x` is sized by its characters.
  check(flag, [selectorOf(flag)], `12${word(1)}` as Hex, "data without 0x");
});
