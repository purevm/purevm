import { expect, test } from "vitest";

import {
  bytesToHex,
  hexToBigInt,
  hexToBytes,
  hexToNumber,
  isHex,
  isQuantity,
  toQuantity,
} from "../hex.js";

test("recognizes hex data and canonical quantities", () => {
  expect([isHex("0x"), isHex("0x00ff"), isHex("0xg"), isHex("ff"), isHex(1)]).toEqual([
    true,
    true,
    false,
    false,
    false,
  ]);
  expect([isQuantity("0x0"), isQuantity("0x1a"), isQuantity("0x"), isQuantity("0x01")]).toEqual([
    true,
    true,
    false,
    false,
  ]);
});

test("converts hex to bigint and number", () => {
  expect(hexToBigInt("0x")).toBe(0n);
  expect(hexToBigInt("0x00ff")).toBe(255n);
  expect(hexToBigInt("0xffffffffffffffffffff")).toBe(2n ** 80n - 1n);
  expect(hexToNumber("0x10")).toBe(16);
  expect(hexToNumber("0x1fffffffffffff")).toBe(Number.MAX_SAFE_INTEGER);
});

test("rejects invalid or unsafe hex conversions", () => {
  expect(() => hexToBigInt("0xzz")).toThrow(TypeError);
  expect(() => hexToNumber("0x20000000000000")).toThrow(RangeError);
});

test("encodes canonical quantities", () => {
  expect(toQuantity(0)).toBe("0x0");
  expect(toQuantity(255)).toBe("0xff");
  expect(toQuantity(2n ** 80n)).toBe("0x100000000000000000000");
  expect(() => toQuantity(-1)).toThrow(RangeError);
  expect(() => toQuantity(-1n)).toThrow(RangeError);
  expect(() => toQuantity(1.5)).toThrow(RangeError);
});

test("round-trips bytes", () => {
  const bytes = Uint8Array.of(0, 1, 171, 255);

  expect(bytesToHex(bytes)).toBe("0x0001abff");
  expect(hexToBytes("0x0001ABff")).toEqual(bytes);
  expect(hexToBytes("0x")).toEqual(new Uint8Array());
  expect(() => hexToBytes("0x123")).toThrow(TypeError);
});
