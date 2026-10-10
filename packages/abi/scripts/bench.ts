// Compares event-log decoding throughput with viem on representative event shapes.
// Usage: pnpm --filter @gobbl3r/abi bench
import assert from "node:assert/strict";

import {
  decodeEventLog as viemDecodeEventLog,
  encodeAbiParameters,
  encodeEventTopics,
  type AbiEvent,
  type Hex,
} from "viem";

import {
  compileEventLogDecoder,
  decodeEventLog,
  type AnyEventLogDecoder,
  type DecodeEventLogOptions,
} from "../src/index.ts";
import { bytesToHex } from "../src/hex.ts";
import { bytesToBigInt } from "../src/utils/bytes.ts";
import { createRandom, randomValue } from "../tests/random.ts";

const EVENTS: readonly AbiEvent[] = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TransferSingle",
    inputs: [
      { name: "operator", type: "address", indexed: true },
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "id", type: "uint256", indexed: false },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OrderFilled",
    inputs: [
      { name: "orderHash", type: "bytes32", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "taker", type: "address", indexed: true },
      { name: "makerAssetId", type: "uint256", indexed: false },
      { name: "takerAssetId", type: "uint256", indexed: false },
      { name: "makerAmountFilled", type: "uint256", indexed: false },
      { name: "takerAmountFilled", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchWithStrings",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      {
        name: "orders",
        type: "tuple[]",
        indexed: false,
        components: [
          { name: "id", type: "uint256" },
          { name: "maker", type: "address" },
          { name: "memo", type: "string" },
          { name: "payload", type: "bytes" },
        ],
      },
    ],
  },
];

type Log = {
  /** viem currently requires a mutable non-empty tuple for decoded log topics. */
  readonly topics: [Hex, ...Hex[]];
  readonly data: Hex;
};

const LOGS_PER_EVENT = 1_000;
const WARMUP_PASSES = 20;
const DURATION_MS = 1_000;

const logsOf = (event: AbiEvent): readonly Log[] => {
  const random = createRandom(42);
  return Array.from({ length: LOGS_PER_EVENT }, () => {
    const values = Object.fromEntries(
      event.inputs.map((input) => [input.name, randomValue(random, input)]),
    );
    const indexed = event.inputs.filter((input) => input.indexed);
    const encodedTopics = encodeEventTopics({
      abi: [event],
      args: Object.fromEntries(indexed.map((input) => [input.name, values[input.name ?? ""]])),
    } as never) as Hex[];
    const [signature, ...argumentTopics] = encodedTopics;
    if (signature === undefined) {
      throw new Error(`No topic0 generated for ${event.name}.`);
    }
    const topics: [Hex, ...Hex[]] = [signature, ...argumentTopics];
    const dataInputs = event.inputs.filter((input) => !input.indexed);
    const data = encodeAbiParameters(
      dataInputs,
      dataInputs.map((input) => values[input.name ?? ""]),
    );
    return { topics, data };
  });
};

/** Operations per second over `inputs`, after an identical warm-up for every candidate. */
const measure = <input>(inputs: readonly input[], run: (value: input) => unknown): number => {
  for (let pass = 0; pass < WARMUP_PASSES; pass++) {
    for (const value of inputs) {
      run(value);
    }
  }

  let count = 0;
  const start = performance.now();
  let now = start;
  while (now - start < DURATION_MS) {
    for (const value of inputs) {
      run(value);
    }
    count += inputs.length;
    now = performance.now();
  }
  return (count / (now - start)) * 1_000;
};

const formatRate = (perSecond: number): string =>
  `${Math.round(perSecond / 1_000).toLocaleString("en")}k/s`;

const formatComparison = (perSecond: number, basePerSecond: number): string =>
  `${formatRate(perSecond)} (${(perSecond / basePerSecond).toFixed(2)}×)`;

const row = (columns: readonly string[]): string =>
  columns.map((column, index) => (index === 0 ? column.padEnd(18) : column.padStart(19))).join("");

const CHECKSUM: DecodeEventLogOptions = { addressFormat: "checksum" };
const CUSTOM: DecodeEventLogOptions = { addressFormat: (address) => address };

// Compiled decoders live in a caller-owned registry, as a consumer would hold them.
const registries = {
  raw: new Map<Hex, AnyEventLogDecoder>(),
  checksum: new Map<Hex, AnyEventLogDecoder>(),
  custom: new Map<Hex, AnyEventLogDecoder>(),
};
const decodeWith = (registry: Map<Hex, AnyEventLogDecoder>, log: Log): unknown => {
  const decoder = registry.get(log.topics[0]);
  if (decoder === undefined) {
    throw new Error(`No decoder registered for ${log.topics[0]}.`);
  }
  return decoder(log);
};

const toPositionalValue = (param: AbiEvent["inputs"][number], value: unknown): unknown => {
  const array = /^(.*)\[(?:\d+)?\]$/.exec(param.type);
  const innerType = array?.[1];
  if (innerType !== undefined && Array.isArray(value)) {
    return value.map((item) => toPositionalValue({ ...param, type: innerType }, item));
  }
  const components = "components" in param ? param.components : undefined;
  if (param.type === "tuple" && components !== undefined) {
    const record = value as Record<string, unknown>;
    return components.map((component, index) =>
      toPositionalValue(
        component,
        Array.isArray(value) ? value[index] : record[component.name ?? ""],
      ),
    );
  }
  return value;
};

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

console.log("All canonicality checks are on; viem uses strict: true.");
console.log("raw = no address formatting, checksum = EIP-55, custom = identity callback.");
console.log(
  row([
    "event",
    "viem strict",
    "stateless raw",
    "+ abiTopic0 raw",
    "compiled raw",
    "compiled checksum",
    "compiled custom",
  ]),
);

for (const event of EVENTS) {
  const logs = logsOf(event);
  const firstLog = logs[0];
  const abiTopic0 = firstLog?.topics[0];
  if (firstLog === undefined || abiTopic0 === undefined) {
    throw new Error(`No benchmark log generated for ${event.name}.`);
  }

  registries.raw.set(abiTopic0, compileEventLogDecoder({ abi: event, abiTopic0 }));
  registries.checksum.set(
    abiTopic0,
    compileEventLogDecoder({ abi: event, abiTopic0, options: CHECKSUM }),
  );
  registries.custom.set(
    abiTopic0,
    compileEventLogDecoder({ abi: event, abiTopic0, options: CUSTOM }),
  );

  const abi = [event] as const;
  const runViem = (log: Log): unknown =>
    viemDecodeEventLog({ abi, topics: log.topics, data: log.data, strict: true });
  const runStateless = (log: Log): unknown => decodeEventLog({ abi: event, payload: log });
  const runWithTopic0 = (log: Log): unknown =>
    decodeEventLog({ abi: event, abiTopic0, payload: log });
  const runRaw = (log: Log): unknown => decodeWith(registries.raw, log);
  const runChecksum = (log: Log): unknown => decodeWith(registries.checksum, log);
  const runCustom = (log: Log): unknown => decodeWith(registries.custom, log);

  // Fail early if a benchmark branch does not perform the same decode.
  assert.deepStrictEqual(runChecksum(firstLog), toPositionalResult(event, runViem(firstLog)));
  const raw = runRaw(firstLog);
  assert.deepStrictEqual(runStateless(firstLog), raw);
  assert.deepStrictEqual(runWithTopic0(firstLog), raw);
  assert.deepStrictEqual(runCustom(firstLog), raw);

  const viem = measure(logs, runViem);
  console.log(
    row([
      event.name,
      formatRate(viem),
      formatComparison(measure(logs, runStateless), viem),
      formatComparison(measure(logs, runWithTopic0), viem),
      formatComparison(measure(logs, runRaw), viem),
      formatComparison(measure(logs, runChecksum), viem),
      formatComparison(measure(logs, runCustom), viem),
    ]),
  );
}

// Measures the current DataView implementation against the previous hex-string conversion.
const bytesToBigIntHex = (bytes: Uint8Array): bigint => BigInt(bytesToHex(bytes));

const random = createRandom(7);
const words = Array.from({ length: LOGS_PER_EVENT }, () =>
  Uint8Array.from({ length: 32 }, () => random.int(256)),
);
for (const word of words) {
  assert.equal(bytesToBigIntHex(word), bytesToBigInt(word));
}
const current = measure(words, (word) => bytesToBigInt(word));
console.log();
console.log(row(["uint256 word", "current DataView", "previous hex"]));
console.log(
  row([
    "bytesToBigInt",
    formatRate(current),
    formatComparison(measure(words, bytesToBigIntHex), current),
  ]),
);
