import { describe, expect, test } from "vitest";

import { BlockState } from "../block-state.js";
import { parseBlockHeader } from "../block.js";
import type { BlockHeader, RpcBlockHeader } from "../types.js";

const hash = (character: string) => `0x${character.repeat(64)}` as const;
const header = (number: number, character: string, parentCharacter: string): BlockHeader =>
  parseBlockHeader(
    {
      hash: hash(character),
      number: `0x${number.toString(16)}`,
      parentHash: hash(parentCharacter),
      timestamp: "0x64",
    },
    1_000,
  );

describe("parseBlockHeader", () => {
  test("normalizes hashes and exposes bigint and hex values", () => {
    const value = parseBlockHeader({
      hash: hash("A"),
      number: "0x10",
      parentHash: hash("B"),
      timestamp: "0x64",
    });

    expect(value).toMatchObject({
      hash: hash("a"),
      number: 16n,
      numberHex: "0x10",
      parentHash: hash("b"),
      timestamp: 100n,
      timestampHex: "0x64",
    });
  });

  test.each([
    [{ hash: "0x1", number: "0x1", parentHash: hash("a"), timestamp: "0x1" }, "hash"],
    [{ hash: hash("a"), number: "0x01", parentHash: hash("b"), timestamp: "0x1" }, "number"],
    [{ hash: hash("a"), number: "0x1", parentHash: "0x1", timestamp: "0x1" }, "parent hash"],
    [{ hash: hash("a"), number: "0x1", parentHash: hash("b"), timestamp: "1" }, "timestamp"],
  ])("rejects an invalid %s", (value, field) => {
    expect(() => parseBlockHeader(value as RpcBlockHeader)).toThrow(`invalid ${field}`);
  });
});

describe("BlockState", () => {
  test("classifies blocks, replacements, parent reorgs, gaps, duplicates, and old blocks", () => {
    const state = new BlockState();
    const first = header(10, "a", "0");
    const next = header(11, "b", "a");
    const replacement = header(11, "c", "a");
    const disconnected = header(12, "d", "f");
    const jumped = header(15, "e", "d");

    expect(state.update(first, "http")).toEqual({
      event: { block: first, source: "http", type: "block" },
      status: "accepted",
    });
    expect(state.update(first, "websocket")).toEqual({ status: "duplicate" });
    expect(state.update(next, "websocket")).toMatchObject({
      event: { block: next, previous: first, type: "block" },
      status: "accepted",
    });
    expect(state.update(replacement, "websocket")).toMatchObject({
      event: { block: replacement, kind: "replacement", previous: next, type: "reorg" },
    });
    expect(state.update(disconnected, "websocket")).toMatchObject({
      event: {
        block: disconnected,
        kind: "parent-mismatch",
        previous: replacement,
        type: "reorg",
      },
    });
    expect(state.update(jumped, "http")).toMatchObject({
      event: {
        block: jumped,
        missing: { count: 2n, from: 13n, to: 14n },
        previous: disconnected,
        type: "gap",
      },
    });
    expect(state.update(disconnected, "websocket")).toEqual({ status: "old" });
  });

  test("clear removes the retained head", () => {
    const state = new BlockState();
    const block = header(1, "a", "0");
    state.update(block, "http");
    state.clear();
    expect(state.update(block, "http")).toMatchObject({ event: { previous: undefined } });
  });
});
