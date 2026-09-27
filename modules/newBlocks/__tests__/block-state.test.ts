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
  test("classifies first, next, duplicate, gap, and parent mismatch", () => {
    const state = new BlockState(8);
    expect(state.relation(header(10, "a", "0"))).toBe("first");
    state.accept(header(10, "a", "0"));

    expect(state.relation(header(11, "b", "a"))).toBe("next");
    expect(state.relation(header(10, "a", "0"))).toBe("duplicate");
    expect(state.relation(header(13, "d", "c"))).toBe("gap");
    expect(state.relation(header(11, "b", "f"))).toBe("parent-mismatch");
  });

  test("detects replacements at the head and below it", () => {
    const state = new BlockState(8);
    for (const [number, character, parent] of [
      [10, "a", "0"],
      [11, "b", "a"],
      [12, "c", "b"],
    ] as const) {
      state.accept(header(number, character, parent));
    }

    expect(state.relation(header(12, "e", "b"))).toBe("replacement");
    expect(state.relation(header(11, "e", "a"))).toBe("replacement");
    expect(state.relation(header(11, "b", "a"))).toBe("duplicate");
  });

  test("forgets heights above an accepted lower replacement", () => {
    const state = new BlockState(8);
    state.accept(header(10, "a", "0"));
    state.accept(header(11, "b", "a"));
    state.accept(header(12, "c", "b"));

    state.accept(header(11, "e", "a"));

    expect(state.head?.hash).toBe(hash("e"));
    expect(state.at(12n)).toBeUndefined();
    expect(state.relation(header(12, "f", "e"))).toBe("next");
  });

  test("keeps a bounded history and reports older heights as stale", () => {
    const state = new BlockState(2);
    state.accept(header(10, "a", "0"));
    state.accept(header(11, "b", "a"));
    state.accept(header(12, "c", "b"));

    expect(state.at(10n)).toBeUndefined();
    expect(state.at(11n)?.hash).toBe(hash("b"));
    expect(state.relation(header(10, "a", "0"))).toBe("stale");
  });

  test("clear removes the head and history", () => {
    const state = new BlockState(8);
    state.accept(header(10, "a", "0"));

    state.clear();

    expect(state.head).toBeUndefined();
    expect(state.at(10n)).toBeUndefined();
    expect(state.relation(header(10, "a", "0"))).toBe("first");
  });
});
