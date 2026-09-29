import {
  HttpStatusError,
  RpcProviderError,
  RpcTimeoutError,
  type HttpRequestOptions,
  type LogsByRangeFilter,
  type RpcLog,
  type TraceEntry,
  type TraceFilterParameters,
} from "@purevm/rpc-public";
import { describe, expect, test, vi } from "vitest";

import { fetchLogsRange } from "../logs.request.js";
import { fetchTracesRange } from "../traces.request.js";
import { fakeContext } from "./helpers.js";

type GetLogs = (filter: LogsByRangeFilter, options?: HttpRequestOptions) => Promise<RpcLog[]>;
type GetTraces = (
  filter: TraceFilterParameters,
  options?: HttpRequestOptions,
) => Promise<TraceEntry[]>;

const log = { blockHash: "0x1" } as unknown as RpcLog;
const trace = (index: number) =>
  ({
    blockHash: "0x1",
    traceAddress: [index],
    transactionHash: "0x2",
    type: "call",
  }) as unknown as TraceEntry;
const tooLarge = () =>
  new RpcProviderError({ code: -32005, message: "query returned more than 10000 results" });

describe("eth_getLogs ranges", () => {
  test("splits a range whose response reaches the configured limit", async () => {
    const ethGetLogsByRange = vi
      .fn<GetLogs>()
      .mockResolvedValueOnce([log, log])
      .mockResolvedValueOnce([log])
      .mockResolvedValueOnce([log]);

    await expect(
      fetchLogsRange(fakeContext({ ethGetLogsByRange }), 10n, 13n, 2),
    ).resolves.toHaveLength(2);
    expect(ethGetLogsByRange.mock.calls.map(([filter]) => filter)).toEqual([
      { fromBlock: "0xa", toBlock: "0xd" },
      { fromBlock: "0xa", toBlock: "0xb" },
      { fromBlock: "0xc", toBlock: "0xd" },
    ]);
  });

  test("splits a range the provider rejects as too large", async () => {
    const ethGetLogsByRange = vi
      .fn<GetLogs>()
      .mockRejectedValueOnce(tooLarge())
      .mockResolvedValue([]);

    await expect(fetchLogsRange(fakeContext({ ethGetLogsByRange }), 1n, 2n, 10)).resolves.toEqual(
      [],
    );
    expect(ethGetLogsByRange).toHaveBeenCalledTimes(3);
  });

  test.each([
    ["an authentication failure", new HttpStatusError(401, "Unauthorized", "invalid api key")],
    [
      "a rate limit",
      new RpcProviderError({
        code: -32005,
        message: "daily request count exceeded, request rate limited",
      }),
    ],
  ])("rethrows %s without splitting", async (_name, error) => {
    const ethGetLogsByRange = vi.fn<GetLogs>().mockRejectedValue(error);

    await expect(
      fetchLogsRange(fakeContext({ ethGetLogsByRange }), 0n, 1_023n, 10_000),
    ).rejects.toBe(error);
    expect(ethGetLogsByRange).toHaveBeenCalledOnce();
  });

  test("rejects a single block that is still too large, keeping the cause", async () => {
    const cause = tooLarge();
    const rejected = vi.fn<GetLogs>().mockRejectedValue(cause);
    await expect(
      fetchLogsRange(fakeContext({ ethGetLogsByRange: rejected }), 1n, 1n, 10),
    ).rejects.toMatchObject({ cause, message: "eth_getLogs rejected block 1 as too large" });

    const limited = vi.fn<GetLogs>().mockResolvedValue([log, log]);
    await expect(
      fetchLogsRange(fakeContext({ ethGetLogsByRange: limited }), 1n, 1n, 2),
    ).rejects.toThrow("Block 1 reached maxLogsPerRequest 2");
  });

  test("keeps split requests within the concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    const ethGetLogsByRange = vi.fn<GetLogs>(async (filter) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      if (filter.fromBlock !== filter.toBlock) throw tooLarge();
      return [];
    });

    await fetchLogsRange(fakeContext({ ethGetLogsByRange }, {}, 3), 0n, 63n, 10);

    expect(maxActive).toBe(3);
  });
});

describe("trace_filter ranges", () => {
  test("pages until an empty page even when the provider caps short pages", async () => {
    const traceFilter = vi
      .fn<GetTraces>()
      .mockResolvedValueOnce([trace(0), trace(1)])
      .mockResolvedValueOnce([trace(2)])
      .mockResolvedValueOnce([]);

    await expect(fetchTracesRange(fakeContext({ traceFilter }), 1n, 1n, 10)).resolves.toHaveLength(
      3,
    );
    expect(traceFilter.mock.calls.map(([filter]) => filter.after)).toEqual([0, 2, 3]);
  });

  test("rejects a provider that ignores the after offset", async () => {
    const traceFilter = vi.fn<GetTraces>().mockResolvedValue([trace(0)]);

    await expect(fetchTracesRange(fakeContext({ traceFilter }), 1n, 1n, 10)).rejects.toThrow(
      'trace_filter ignored the "after" offset for blocks 1-1',
    );
  });

  test("splits a range that times out and rethrows other failures", async () => {
    const splitting = vi
      .fn<GetTraces>()
      .mockRejectedValueOnce(new RpcTimeoutError(1_000))
      .mockResolvedValue([]);
    await expect(
      fetchTracesRange(fakeContext({ traceFilter: splitting }), 1n, 2n, 10),
    ).resolves.toEqual([]);

    const denied = new HttpStatusError(401, "Unauthorized", "");
    const failing = vi.fn<GetTraces>().mockRejectedValue(denied);
    await expect(
      fetchTracesRange(fakeContext({ traceFilter: failing }), 0n, 1_023n, 10),
    ).rejects.toBe(denied);
    expect(failing).toHaveBeenCalledOnce();

    const single = vi.fn<GetTraces>().mockRejectedValue(tooLarge());
    await expect(
      fetchTracesRange(fakeContext({ traceFilter: single }), 5n, 5n, 10),
    ).rejects.toThrow("trace_filter rejected block 5 as too large");
  });
});
