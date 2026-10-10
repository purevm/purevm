import type { AbiParameter } from "viem";

export type Random = {
  /** Uniform in [0, 1). */
  readonly next: () => number;
  /** Uniform integer in [0, max). */
  readonly int: (max: number) => number;
  /** `bytes` random bytes as hex. */
  readonly hex: (bytes: number) => `0x${string}`;
};

/** Deterministic PRNG (mulberry32), so a failing case can be replayed from its seed. */
export const createRandom = (seed: number): Random => {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (max: number): number => Math.floor(next() * max);
  const hex = (bytes: number): `0x${string}` => {
    let out = "0x";
    for (let i = 0; i < bytes; i++) out += int(256).toString(16).padStart(2, "0");
    return out as `0x${string}`;
  };
  return { next, int, hex };
};

const TEXTS = [
  "",
  "a",
  "hello world",
  "é漢字🙂",
  "x".repeat(31),
  "y".repeat(32),
  "z".repeat(33),
  "w".repeat(100),
];

/** A random value of `parameter`, in the shape viem encodes and decodes. */
export const randomValue = (random: Random, parameter: AbiParameter): unknown => {
  const { type } = parameter;
  const array = /^(.*)\[(\d*)\]$/.exec(type);
  if (array !== null) {
    const length = array[2] === "" ? random.int(4) : Number(array[2]);
    const element = { ...parameter, type: array[1] as string };
    return Array.from({ length }, () => randomValue(random, element));
  }
  if (type === "tuple") {
    const components = "components" in parameter ? parameter.components : [];
    const named = components.length > 0 && components.every((c) => c.name);
    const values = components.map((c) => randomValue(random, c));
    return named ? Object.fromEntries(components.map((c, i) => [c.name, values[i]])) : values;
  }
  if (type === "address") return random.hex(20);
  if (type === "bool") return random.int(2) === 1;
  if (type === "string") return TEXTS[random.int(TEXTS.length)];
  if (type === "bytes") return random.hex([0, 1, 31, 32, 33, 70][random.int(6)] as number);
  const fixed = /^bytes(\d+)$/.exec(type);
  if (fixed !== null) return random.hex(Number(fixed[1]));
  const integer = /^(u?)int(\d*)$/.exec(type);
  if (integer !== null) {
    const bits = integer[2] === "" ? 256 : Number(integer[2]);
    const signed = integer[1] === "";
    // Edges matter most: 0, ±1, the extremes of the range, then random magnitudes.
    const max = signed ? (1n << BigInt(bits - 1)) - 1n : (1n << BigInt(bits)) - 1n;
    const min = signed ? -(1n << BigInt(bits - 1)) : 0n;
    const pick = random.int(6);
    const edges = [0n, max, min, signed ? -1n : 1n];
    const value = edges[pick] ?? BigInt(random.hex(bits / 8)) & max;
    const signedValue = pick >= 4 && signed && random.int(2) === 1 ? -value - 1n : value;
    return bits <= 48 ? Number(signedValue) : signedValue;
  }
  throw new Error(`No generator for ${type}`);
};
