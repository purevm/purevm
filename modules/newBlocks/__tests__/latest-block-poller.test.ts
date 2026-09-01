import { afterEach, describe, expect, test, vi } from "vitest";

import { LatestBlockPoller, type LatestBlockPollerOptions } from "../latest-block-poller.js";
import type { NewBlocksHttpClient, RpcLatestBlock } from "../types.js";

const block: RpcLatestBlock = {
  hash: `0x${"1".repeat(64)}`,
  number: "0x1",
  parentHash: `0x${"0".repeat(64)}`,
  timestamp: "0x1",
};

afterEach(() => vi.useRealTimers());

describe("LatestBlockPoller", () => {
  test("coalesces requests and never overlaps interval polls", async () => {
    vi.useFakeTimers();
    let resolveRequest: ((value: RpcLatestBlock | null) => void) | undefined;
    const client: NewBlocksHttpClient = {
      ethGetBlockByTag: vi.fn<NewBlocksHttpClient["ethGetBlockByTag"]>(
        () => new Promise<RpcLatestBlock | null>((resolve) => (resolveRequest = resolve)),
      ),
    };
    const onBlock = vi.fn<LatestBlockPollerOptions["onBlock"]>();
    const poller = new LatestBlockPoller({
      client,
      intervalMs: 100,
      onBlock,
      onError: vi.fn<LatestBlockPollerOptions["onError"]>(),
    });

    poller.start();
    expect(poller.pollOnce()).toBe(poller.pollOnce());
    await vi.advanceTimersByTimeAsync(500);
    expect(client.ethGetBlockByTag).toHaveBeenCalledOnce();

    resolveRequest?.(block);
    await vi.advanceTimersByTimeAsync(100);
    expect(onBlock).toHaveBeenCalledWith(block);
    expect(client.ethGetBlockByTag).toHaveBeenCalledTimes(2);
    poller.stop();
  });

  test("reports request failures and ignores null blocks", async () => {
    const onBlock = vi.fn<LatestBlockPollerOptions["onBlock"]>();
    const onError = vi.fn<LatestBlockPollerOptions["onError"]>();
    const client: NewBlocksHttpClient = {
      ethGetBlockByTag: vi
        .fn<NewBlocksHttpClient["ethGetBlockByTag"]>()
        .mockRejectedValueOnce("offline")
        .mockResolvedValueOnce(null),
    };
    const poller = new LatestBlockPoller({ client, intervalMs: 100, onBlock, onError });

    await poller.pollOnce();
    await poller.pollOnce();
    expect(onError.mock.calls[0]?.[0]).toEqual(new Error("offline"));
    expect(onBlock).not.toHaveBeenCalled();
  });

  test.each([0, -1, 1.5])("rejects invalid interval %s", (intervalMs) => {
    expect(
      () =>
        new LatestBlockPoller({
          client: { ethGetBlockByTag: async () => null },
          intervalMs,
          onBlock: vi.fn<LatestBlockPollerOptions["onBlock"]>(),
          onError: vi.fn<LatestBlockPollerOptions["onError"]>(),
        }),
    ).toThrow("Polling interval must be a positive safe integer");
  });
});
