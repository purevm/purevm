import {
  HttpStatusError,
  type BlockHash,
  type EthGetBlockByNumberParameters,
  type HttpClient,
  type HttpRequestOptions,
  type LogsByRangeFilter,
  type RpcBlock,
  type RpcLog,
  type TraceEntry,
  type TraceFilterParameters,
} from "@purevm/rpc-public";
import { describe, expect, test, vi } from "vitest";

import { fetchBlocks } from "../fetch-blocks.js";

type GetBlock = (
  parameters: EthGetBlockByNumberParameters<true>,
  options?: HttpRequestOptions,
) => Promise<RpcBlock<true> | null>;
type GetLogs = (filter: LogsByRangeFilter, options?: HttpRequestOptions) => Promise<RpcLog[]>;
type GetTraces = (
  filter: TraceFilterParameters,
  options?: HttpRequestOptions,
) => Promise<TraceEntry[]>;

const blockHash = `0x${"a".repeat(64)}` as BlockHash;

function createClient() {
  const ethGetBlockByNumber = vi.fn<GetBlock>(
    async ({ blockNumber }) =>
      ({ hash: blockHash, number: blockNumber, transactions: [] }) as unknown as RpcBlock<true>,
  );
  const ethGetLogsByRange = vi.fn<GetLogs>().mockResolvedValue([]);
  const traceFilter = vi.fn<GetTraces>().mockResolvedValue([]);
  return {
    client: { ethGetBlockByNumber, ethGetLogsByRange, traceFilter } as unknown as HttpClient,
    ethGetBlockByNumber,
    ethGetLogsByRange,
    traceFilter,
  };
}

describe("fetchBlocks", () => {
  test("runs all sources with defaults and returns ordered empty blocks", async () => {
    const calls = createClient();
    const result = await fetchBlocks(calls.client, { fromBlock: 10n, toBlock: 11n });

    expect(result.blocks.map((block) => block.blockNumber)).toEqual([10n, 11n]);
    expect(calls.ethGetBlockByNumber).toHaveBeenCalledTimes(2);
    const withSignal = { signal: expect.any(AbortSignal) };
    expect(calls.ethGetLogsByRange).toHaveBeenCalledWith(
      { fromBlock: "0xa", toBlock: "0xb" },
      withSignal,
    );
    expect(calls.traceFilter).toHaveBeenCalledWith(
      { after: 0, count: 10_000, fromBlock: "0xa", toBlock: "0xb" },
      withSignal,
    );
  });

  test("forwards custom limits and request options", async () => {
    const calls = createClient();
    const requestOptions: HttpRequestOptions = { timeoutMs: 123 };
    await fetchBlocks(calls.client, {
      concurrency: 1,
      fromBlock: 10n,
      maxLogsPerRequest: 5,
      requestOptions,
      toBlock: 10n,
      tracePageSize: 6,
    });

    const forwarded = { signal: expect.any(AbortSignal), timeoutMs: 123 };
    expect(calls.ethGetBlockByNumber).toHaveBeenCalledWith(
      { blockNumber: "0xa", includeTransactions: true },
      forwarded,
    );
    expect(calls.ethGetLogsByRange).toHaveBeenCalledWith(
      { fromBlock: "0xa", toBlock: "0xa" },
      forwarded,
    );
    expect(calls.traceFilter).toHaveBeenCalledWith(
      { after: 0, count: 6, fromBlock: "0xa", toBlock: "0xa" },
      forwarded,
    );
  });

  test("aborts every other request as soon as one fails for good", async () => {
    const calls = createClient();
    const denied = new HttpStatusError(401, "Unauthorized", "invalid api key");
    const signals: AbortSignal[] = [];
    // Like the real transport: a pending request rejects when its signal aborts.
    calls.ethGetBlockByNumber.mockImplementation(
      (_parameters, options) =>
        new Promise((_resolve, reject) => {
          const signal = options?.signal;
          if (signal) signals.push(signal);
          signal?.addEventListener("abort", () => reject(signal.reason));
        }),
    );
    calls.traceFilter.mockImplementation(() => new Promise(() => undefined));
    calls.ethGetLogsByRange.mockImplementation(async () => {
      await Promise.resolve();
      throw denied;
    });

    await expect(fetchBlocks(calls.client, { fromBlock: 0n, toBlock: 1_023n })).rejects.toBe(
      denied,
    );

    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(calls.ethGetLogsByRange).toHaveBeenCalledOnce();
    // Three block requests got the free slots and the failing logs request handed its slot to a
    // fourth before the abort. The other 1 020 queued block requests never started.
    expect(calls.ethGetBlockByNumber.mock.calls.length).toBe(4);
  });

  test("honors an external abort signal", async () => {
    const calls = createClient();
    const controller = new AbortController();
    let received: AbortSignal | undefined;
    calls.ethGetLogsByRange.mockImplementation(async (_filter, options) => {
      received = options?.signal;
      return [];
    });

    await fetchBlocks(calls.client, {
      fromBlock: 1n,
      requestOptions: { signal: controller.signal },
      toBlock: 1n,
    });
    controller.abort();

    expect(received?.aborted).toBe(true);
  });

  test("rejects an invalid concurrency", async () => {
    await expect(
      fetchBlocks(createClient().client, { concurrency: 0, fromBlock: 1n, toBlock: 1n }),
    ).rejects.toThrow("concurrency must be a positive safe integer");
  });
});
