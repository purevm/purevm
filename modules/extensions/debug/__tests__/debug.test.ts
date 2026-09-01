import type {
  BlockHash,
  BlockNumber,
  DebugBlockTrace,
  DebugCallFrame,
  HttpClient,
  HttpRequestOptions,
  TransactionHash,
} from "@purevm/rpc";
import { describe, expect, it, vi } from "vitest";

import { getBlockDebugTracesByHash } from "../getBlockDebugTracesByHash.js";
import { getBlockDebugTracesByNumber } from "../getBlockDebugTracesByNumber.js";
import { getBlockDebugTracesByTag } from "../getBlockDebugTracesByTag.js";

const UPPER_HASH = `0x${"E".repeat(64)}` as TransactionHash;
const LOWER_HASH = UPPER_HASH.toLowerCase() as TransactionHash;
const BLOCK_HASH = `0x${"f".repeat(64)}` as BlockHash;
const BLOCK_NUMBER = "0x30" as BlockNumber;
const options: HttpRequestOptions = { timeoutMs: 500 };

const child = {
  from: "0x1",
  gas: "0x1",
  gasUsed: "0x1",
  input: "0x",
  type: "CREATE2",
} as DebugCallFrame;
const root = {
  calls: [child],
  error: "execution reverted",
  from: "0x1",
  gas: "0x1",
  gasUsed: "0x1",
  input: "0x1234",
  output: "0xabcd",
  to: "0x2",
  type: "CALL",
  value: "0x2",
} as DebugCallFrame;
const response: DebugBlockTrace[] = [{ result: root, txHash: UPPER_HASH }];

describe("debug trace extensions", () => {
  it("flattens call trees and propagates parent errors", async () => {
    const client = {
      debugTraceBlockByNumber: vi.fn<() => Promise<unknown>>().mockResolvedValue(response),
    } as unknown as HttpClient;

    const result = await getBlockDebugTracesByNumber(client, BLOCK_NUMBER, options);

    expect(client.debugTraceBlockByNumber).toHaveBeenCalledWith(
      BLOCK_NUMBER,
      { tracer: "callTracer" },
      options,
    );
    expect(result.traces[LOWER_HASH]).toEqual([
      {
        error: "execution reverted",
        from: "0x1",
        input: "0x1234",
        output: "0xabcd",
        path: [],
        to: "0x2",
        type: "CALL",
        value: "0x2",
      },
      {
        error: "execution reverted",
        from: "0x1",
        input: "0x",
        output: "0x",
        path: [0],
        to: null,
        type: "CREATE2",
        value: "0x0",
      },
    ]);
  });

  it("formats destruction frames", async () => {
    const destruction = { ...root, calls: undefined, type: "SELFDESTRUCT" } as DebugCallFrame;
    const client = {
      debugTraceBlockByHash: vi
        .fn<() => Promise<unknown>>()
        .mockResolvedValue([{ result: destruction, txHash: UPPER_HASH }]),
    } as unknown as HttpClient;

    const result = await getBlockDebugTracesByHash(client, BLOCK_HASH);

    expect(result.traces[LOWER_HASH]?.[0]).toMatchObject({
      from: "0x1",
      path: [],
      to: "0x2",
      type: "SELFDESTRUCT",
      value: "0x2",
    });
  });

  it("delegates tag selectors and rejects malformed transaction hashes", async () => {
    const debugTraceBlockByTag = vi.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const client = { debugTraceBlockByTag } as unknown as HttpClient;

    await getBlockDebugTracesByTag(client, "finalized", options);
    expect(debugTraceBlockByTag).toHaveBeenCalledWith(
      "finalized",
      { tracer: "callTracer" },
      options,
    );

    debugTraceBlockByTag.mockResolvedValue([{ result: root, txHash: "0x1" }]);
    await expect(getBlockDebugTracesByTag(client, "latest")).rejects.toThrow(
      "must be a 32-byte hexadecimal hash",
    );
  });

  it("formats every call and destruction operation with canonical nulls", async () => {
    const types: DebugCallFrame["type"][] = [
      "CALLCODE",
      "DELEGATECALL",
      "STATICCALL",
      "CREATE",
      "SUICIDE",
    ];
    const debugTraceBlockByTag = vi.fn<() => Promise<unknown>>().mockResolvedValue(
      types.map((type, index) => ({
        result: { ...root, error: "", output: undefined, to: undefined, type },
        txHash: `0x${String(index + 1).repeat(64)}`,
      })),
    );
    const client = { debugTraceBlockByTag } as unknown as HttpClient;

    const result = await getBlockDebugTracesByTag(client, "latest");

    for (const traces of Object.values(result.traces)) {
      expect(traces[0]).toMatchObject({ error: null, path: [], to: null });
    }
  });

  it("rejects duplicate transaction hashes", async () => {
    const client = {
      debugTraceBlockByHash: vi
        .fn<() => Promise<unknown>>()
        .mockResolvedValue([response[0], response[0]]),
    } as unknown as HttpClient;

    await expect(getBlockDebugTracesByHash(client, BLOCK_HASH)).rejects.toThrow(
      "duplicate transaction hash",
    );
  });
});
