import type {
  BlockHash,
  BlockNumber,
  HttpClient,
  HttpRequestOptions,
  TraceCallEntry,
  TraceCreateEntry,
  TraceEntry,
  TraceRewardEntry,
  TraceSuicideEntry,
  TransactionHash,
} from "@purevm/public";
import { describe, expect, it, vi } from "vitest";

import { NULL_TRANSACTION_HASH } from "../../constants.js";
import { ExtensionDataError } from "../../errors/index.js";
import { getBlockParityTracesByHash } from "../getBlockParityTracesByHash.js";
import { getBlockParityTracesByNumber } from "../getBlockParityTracesByNumber.js";
import { getBlockParityTracesByTag } from "../getBlockParityTracesByTag.js";
import { getBlocksTraces } from "../getBlocksTraces.js";

const UPPER_TX_HASH = `0x${"A".repeat(64)}` as TransactionHash;
const LOWER_TX_HASH = UPPER_TX_HASH.toLowerCase() as TransactionHash;
const UPPER_BLOCK_HASH = `0x${"B".repeat(64)}` as BlockHash;
const LOWER_BLOCK_HASH = UPPER_BLOCK_HASH.toLowerCase() as BlockHash;
const OTHER_BLOCK_HASH = `0x${"c".repeat(64)}` as BlockHash;
const BLOCK_NUMBER = "0x40" as BlockNumber;
const options: HttpRequestOptions = { timeoutMs: 750 };

const childCall = {
  action: {
    callType: "delegatecall",
    from: "0x1",
    gas: "0x1",
    input: "0x1234",
    to: "0x2",
    value: "0x0",
  },
  blockHash: UPPER_BLOCK_HASH,
  blockNumber: 64,
  result: null,
  subtraces: 0,
  traceAddress: [0],
  transactionHash: UPPER_TX_HASH,
  transactionPosition: 0,
  type: "call",
} as TraceCallEntry;

const parentCreate = {
  action: {
    creationMethod: "create2",
    from: "0x1",
    gas: "0x2",
    init: "0xabcd",
    value: "0x3",
  },
  blockHash: UPPER_BLOCK_HASH,
  blockNumber: 64,
  error: "parent failed",
  result: { address: "0x3", code: "0xbeef", gasUsed: "0x1" },
  subtraces: 1,
  traceAddress: [],
  transactionHash: UPPER_TX_HASH,
  transactionPosition: 0,
  type: "create",
} as TraceCreateEntry;

const suicide = {
  action: { address: "0x3", balance: "0x4", refundAddress: "0x4" },
  blockHash: UPPER_BLOCK_HASH,
  blockNumber: 64,
  result: null,
  subtraces: 0,
  traceAddress: [1],
  transactionHash: UPPER_TX_HASH,
  transactionPosition: 0,
  type: "suicide",
} as TraceSuicideEntry;

const reward = {
  action: { author: "0x5", rewardType: "block", value: "0x5" },
  blockHash: UPPER_BLOCK_HASH,
  blockNumber: 64,
  result: null,
  subtraces: 0,
  traceAddress: [],
  type: "reward",
} as TraceRewardEntry;

const response: TraceEntry[] = [childCall, parentCreate, suicide, reward];

describe("parity trace extensions", () => {
  it("normalizes every trace kind and inherits ancestor errors", async () => {
    const traceBlockByNumber = vi.fn<() => Promise<unknown>>().mockResolvedValue(response);
    const client = { traceBlockByNumber } as unknown as HttpClient;

    const result = await getBlockParityTracesByNumber(client, BLOCK_NUMBER, options);

    expect(traceBlockByNumber).toHaveBeenCalledWith({ blockNumber: BLOCK_NUMBER }, options);
    expect(result.blockHash).toBe(LOWER_BLOCK_HASH);
    expect(result.traces[LOWER_TX_HASH]).toEqual([
      {
        error: "parent failed",
        from: "0x1",
        input: "0x1234",
        output: "0x",
        path: [0],
        to: "0x2",
        type: "DELEGATECALL",
        value: "0x0",
      },
      {
        error: "parent failed",
        from: "0x1",
        input: "0xabcd",
        output: "0xbeef",
        path: [],
        to: "0x3",
        type: "CREATE2",
        value: "0x3",
      },
      {
        error: "parent failed",
        from: "0x3",
        path: [1],
        to: "0x4",
        type: "SUICIDE",
        value: "0x4",
      },
    ]);
    expect(result.traces[NULL_TRANSACTION_HASH]).toEqual([
      {
        error: null,
        path: [],
        rewardType: "block",
        to: "0x5",
        type: "REWARD",
        value: "0x5",
      },
    ]);
  });

  it("uses the requested hash for empty hash-based responses", async () => {
    const traceBlockByHash = vi.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const client = { traceBlockByHash } as unknown as HttpClient;

    const result = await getBlockParityTracesByHash(client, UPPER_BLOCK_HASH, options);

    expect(traceBlockByHash).toHaveBeenCalledWith({ blockHash: UPPER_BLOCK_HASH }, options);
    expect(result).toEqual({ blockHash: LOWER_BLOCK_HASH, traces: {} });
  });

  it("returns a null hash for empty number and tag responses", async () => {
    const traceBlockByNumber = vi.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const traceBlockByTag = vi.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const client = { traceBlockByNumber, traceBlockByTag } as unknown as HttpClient;

    await expect(getBlockParityTracesByNumber(client, BLOCK_NUMBER)).resolves.toEqual({
      blockHash: null,
      traces: {},
    });
    await expect(getBlockParityTracesByTag(client, "pending", options)).resolves.toEqual({
      blockHash: null,
      traces: {},
    });
    expect(traceBlockByTag).toHaveBeenCalledWith({ blockTag: "pending" }, options);
  });

  it("rejects inconsistent block hashes", async () => {
    const mismatched = { ...childCall, blockHash: OTHER_BLOCK_HASH } as TraceCallEntry;
    const client = {
      traceBlockByNumber: vi
        .fn<() => Promise<unknown>>()
        .mockResolvedValue([childCall, mismatched]),
    } as unknown as HttpClient;

    await expect(getBlockParityTracesByNumber(client, BLOCK_NUMBER)).rejects.toThrow(
      ExtensionDataError,
    );
  });

  it("groups trace_filter results by block", async () => {
    const secondBlock = {
      ...childCall,
      blockHash: OTHER_BLOCK_HASH,
      blockNumber: 65,
    } as TraceCallEntry;
    const traceFilter = vi.fn<() => Promise<unknown>>().mockResolvedValue([childCall, secondBlock]);
    const client = { traceFilter } as unknown as HttpClient;
    const filter = { fromBlock: "0x40" as BlockNumber, toBlock: "0x41" as BlockNumber };

    const result = await getBlocksTraces(client, filter, options);

    expect(traceFilter).toHaveBeenCalledWith(filter, options);
    expect(result.blocks[64]?.blockHash).toBe(LOWER_BLOCK_HASH);
    expect(result.blocks[65]?.blockHash).toBe(OTHER_BLOCK_HASH);
    expect(result.blocks[64]?.traces[LOWER_TX_HASH]).toHaveLength(1);
  });

  it("rejects invalid trace_filter block numbers", async () => {
    const invalid = { ...childCall, blockNumber: -1 } as TraceCallEntry;
    const client = {
      traceFilter: vi.fn<() => Promise<unknown>>().mockResolvedValue([invalid]),
    } as unknown as HttpClient;

    await expect(getBlocksTraces(client, {})).rejects.toThrow("Invalid trace block number -1");
  });

  it("normalizes all parity call operations and missing creation results", async () => {
    const callTypes: TraceCallEntry["action"]["callType"][] = ["call", "callcode", "staticcall"];
    const calls: TraceCallEntry[] = [];
    for (const [index, callType] of callTypes.entries()) {
      calls.push({
        ...childCall,
        action: { ...childCall.action, callType },
        traceAddress: [index],
      });
    }
    const creation = {
      ...parentCreate,
      action: { ...parentCreate.action, creationMethod: undefined },
      error: "",
      result: null,
      traceAddress: [3],
    } as TraceCreateEntry;
    const client = {
      traceBlockByNumber: vi.fn<() => Promise<unknown>>().mockResolvedValue([...calls, creation]),
    } as unknown as HttpClient;

    const result = await getBlockParityTracesByNumber(client, BLOCK_NUMBER);

    expect(result.traces[LOWER_TX_HASH]?.map((trace) => trace.type)).toEqual([
      "CALL",
      "CALLCODE",
      "STATICCALL",
      "CREATE",
    ]);
    expect(result.traces[LOWER_TX_HASH]?.[3]).toMatchObject({
      error: null,
      output: "0x",
      to: null,
      value: "0x3",
    });
  });

  it("rejects malformed block hashes and accepts empty ranges", async () => {
    const malformed = { ...childCall, blockHash: "0x1" } as TraceCallEntry;
    const malformedClient = {
      traceBlockByNumber: vi.fn<() => Promise<unknown>>().mockResolvedValue([malformed]),
    } as unknown as HttpClient;
    const emptyClient = {
      traceFilter: vi.fn<() => Promise<unknown>>().mockResolvedValue([]),
    } as unknown as HttpClient;

    await expect(getBlockParityTracesByNumber(malformedClient, BLOCK_NUMBER)).rejects.toThrow(
      "must be a 32-byte hexadecimal hash",
    );
    await expect(getBlocksTraces(emptyClient, {})).resolves.toEqual({ blocks: {} });
  });
});
