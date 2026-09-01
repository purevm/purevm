import { describe, expect, test } from "vitest";

import { HeadState, parseBlockHead } from "../head.js";
import type { RpcHead } from "../types.js";

const hash = (character: string) => `0x${character.repeat(64)}` as const;

describe("parseBlockHead", () => {
  test("keeps only a normalized block number and hash", () => {
    expect(parseBlockHead({ hash: hash("A"), number: "0x10" })).toEqual({
      hash: hash("a"),
      number: 16n,
      numberHex: "0x10",
    });
  });

  test.each([
    [{ hash: null, number: "0x1" }, "hash"],
    [{ hash: "0x12", number: "0x1" }, "hash"],
    [{ hash: hash("1"), number: null }, "number"],
    [{ hash: hash("1"), number: "0x01" }, "number"],
  ])("rejects invalid heads", (head, field) => {
    expect(() => parseBlockHead(head as RpcHead)).toThrow(`invalid ${field}`);
  });
});

describe("HeadState", () => {
  test("emits only newer heads and same-height reorgs", () => {
    const state = new HeadState();
    const first = parseBlockHead({ hash: hash("1"), number: "0x10" });
    const newer = parseBlockHead({ hash: hash("2"), number: "0x12" });
    const replacement = parseBlockHead({ hash: hash("3"), number: "0x12" });

    expect(state.update(first, "http")).toEqual({ head: first, source: "http", type: "head" });
    expect(state.update(first, "websocket")).toBeUndefined();
    expect(
      state.update(parseBlockHead({ hash: hash("0"), number: "0xf" }), "websocket"),
    ).toBeUndefined();
    expect(state.update(newer, "websocket")).toEqual({
      head: newer,
      source: "websocket",
      type: "head",
    });
    expect(state.update(replacement, "http")).toEqual({
      head: replacement,
      previous: newer,
      source: "http",
      type: "reorg",
    });
    expect(state.latest).toBe(replacement);

    state.clear();
    expect(state.latest).toBeUndefined();
  });
});
