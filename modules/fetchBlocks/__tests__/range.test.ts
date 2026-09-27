import { describe, expect, test } from "vitest";

import {
  assertBlockRange,
  blockNumbers,
  parseQuantity,
  toBlockNumber,
  toSafeIndex,
} from "../range.utils.js";

describe("block range utilities", () => {
  test("builds inclusive block ranges and quantities", () => {
    expect(() => assertBlockRange(10n, 12n)).not.toThrow();
    expect(blockNumbers(10n, 12n)).toEqual([10n, 11n, 12n]);
    expect(toBlockNumber(16n)).toBe("0x10");
    expect(parseQuantity("0x10", "value")).toBe(16n);
    expect(toSafeIndex("0x10", "index")).toBe(16);
  });

  test("rejects invalid ranges, quantities, and unsafe indexes", () => {
    expect(() => assertBlockRange(-1n, 1n)).toThrow("fromBlock must be non-negative");
    expect(() => assertBlockRange(2n, 1n)).toThrow(
      "fromBlock must be lower than or equal to toBlock",
    );
    expect(() => parseQuantity("0x01", "value")).toThrow("not a valid hex quantity");
    expect(() => toSafeIndex("0x20000000000000", "index")).toThrow(
      "exceeds the safe integer range",
    );
  });
});
