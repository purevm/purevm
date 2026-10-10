import { expect, test } from "vitest";

import {
  formatEther,
  formatGwei,
  formatUnits,
  parseEther,
  parseGwei,
  parseUnits,
} from "../units.js";

test.each([
  [0n, 18, "0"],
  [1n, 18, "0.000000000000000001"],
  [1_500_000_000_000_000_000n, 18, "1.5"],
  [2_000_000_000_000_000_000n, 18, "2"],
  [-1_250_000n, 6, "-1.25"],
  [123n, 0, "123"],
])("formats %s with %i decimals as %s", (value, decimals, expected) => {
  expect(formatUnits(value, decimals)).toBe(expected);
});

test.each([
  ["1.5", 18, 1_500_000_000_000_000_000n],
  ["0.000000000000000001", 18, 1n],
  ["-1.25", 6, -1_250_000n],
  [".5", 1, 5n],
  ["7.", 2, 700n],
  ["42", 0, 42n],
])("parses %s with %i decimals", (value, decimals, expected) => {
  expect(parseUnits(value, decimals)).toBe(expected);
});

test("round-trips every value exactly", () => {
  for (const value of [0n, 1n, 10n ** 18n, 123_456_789_012_345_678_901n, -42n]) {
    expect(parseUnits(formatUnits(value, 18), 18)).toBe(value);
  }
});

test("rejects precision loss and malformed input", () => {
  expect(() => parseUnits("0.0000000000000000001", 18)).toThrow(RangeError);
  expect(() => parseUnits("1e18", 18)).toThrow(TypeError);
  expect(() => parseUnits("", 18)).toThrow(TypeError);
  expect(() => parseUnits("1.2.3", 18)).toThrow(TypeError);
  expect(() => formatUnits(1n, -1)).toThrow(RangeError);
  expect(() => formatUnits(1n, 1.5)).toThrow(RangeError);
});

test("provides ether and gwei shortcuts", () => {
  expect(formatEther(10n ** 18n)).toBe("1");
  expect(parseEther("0.1")).toBe(10n ** 17n);
  expect(formatGwei(1_500_000_000n)).toBe("1.5");
  expect(parseGwei("30")).toBe(30_000_000_000n);
});
