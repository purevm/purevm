import { expect, test } from "vitest";

import { parseBlockHeader } from "../block.js";
import { blockLatency } from "../latency.js";

const header = (number: number, timestamp: number, receivedAt: number) =>
  parseBlockHeader(
    {
      hash: `0x${number.toString(16).padStart(64, "0")}`,
      number: `0x${number.toString(16)}`,
      parentHash: `0x${"0".repeat(64)}`,
      timestamp: `0x${timestamp.toString(16)}`,
    },
    receivedAt,
  );

test("measures propagation from the block timestamp", () => {
  expect(blockLatency(header(10, 1_700_000_000, 1_700_000_001_250))).toEqual({
    propagationMs: 1_250,
  });
});

test("measures the delay since the previous header", () => {
  const previous = header(10, 1_700_000_000, 1_700_000_000_400);
  const current = header(11, 1_700_000_002, 1_700_000_002_900);

  expect(blockLatency(current, previous)).toEqual({ propagationMs: 900, sincePreviousMs: 2_500 });
});

test("reports clock skew as a negative propagation", () => {
  expect(blockLatency(header(10, 1_700_000_001, 1_700_000_000_800)).propagationMs).toBe(-200);
});
