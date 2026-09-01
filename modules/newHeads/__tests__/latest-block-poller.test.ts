import { afterEach, describe, expect, test, vi } from "vitest";

import { LatestBlockPoller, toError } from "../latest-block-poller.js";
import type { NewHeadsHttpClient, RpcLatestBlock } from "../types.js";

const block: RpcLatestBlock = {
  hash: `0x${"1".repeat(64)}`,
  number: "0x1",
};

afterEach(() => vi.useRealTimers());

describe("LatestBlockPoller", () => {
  test("requests only latest and never overlaps requests", async () => {
    vi.useFakeTimers();
    const deferred: { resolve?: (value: RpcLatestBlock | null) => void } = {};
    const client: NewHeadsHttpClient = {
      ethGetBlockByTag: vi.fn<NewHeadsHttpClient["ethGetBlockByTag"]>(
        () =>
          new Promise<RpcLatestBlock | null>((resolve) => {
            deferred.resolve = resolve;
          }),
      ),
    };
    const onBlock = vi.fn<(value: RpcLatestBlock) => void>();
    const poller = new LatestBlockPoller({
      client,
      intervalMs: 100,
      onBlock,
      onError: vi.fn<(error: Error) => void>(),
    });

    poller.start();
    poller.start();
    expect(client.ethGetBlockByTag).toHaveBeenCalledWith({ blockTag: "latest" });
    expect(poller.pollOnce()).toBe(poller.pollOnce());
    await vi.advanceTimersByTimeAsync(500);
    expect(client.ethGetBlockByTag).toHaveBeenCalledTimes(1);

    deferred.resolve?.(block);
    await vi.advanceTimersByTimeAsync(100);
    expect(onBlock).toHaveBeenCalledWith(block);
    expect(client.ethGetBlockByTag).toHaveBeenCalledTimes(2);

    poller.stop();
    poller.stop();
    expect(poller.isRunning).toBe(false);
  });

  test("reports request failures and ignores null blocks", async () => {
    const error = new Error("unavailable");
    const onBlock = vi.fn<(value: RpcLatestBlock) => void>();
    const onError = vi.fn<(error: Error) => void>();
    const responses = [Promise.reject(error), Promise.resolve(null)];
    const poller = new LatestBlockPoller({
      client: {
        ethGetBlockByTag: vi.fn<NewHeadsHttpClient["ethGetBlockByTag"]>(() => {
          const response = responses.shift();
          if (!response) throw new Error("Missing fake response");
          return response;
        }),
      },
      intervalMs: 100,
      onBlock,
      onError,
    });

    await poller.pollOnce();
    await poller.pollOnce();
    expect(onError).toHaveBeenCalledWith(error);
    expect(onBlock).not.toHaveBeenCalled();
  });

  test.each([0, -1, 1.5])("rejects invalid interval %s", (intervalMs) => {
    expect(
      () =>
        new LatestBlockPoller({
          client: {
            ethGetBlockByTag: vi.fn<NewHeadsHttpClient["ethGetBlockByTag"]>(async () => null),
          },
          intervalMs,
          onBlock: vi.fn<(value: RpcLatestBlock) => void>(),
          onError: vi.fn<(error: Error) => void>(),
        }),
    ).toThrow("Polling interval must be a positive safe integer");
  });

  test("normalizes non-Error failures", () => {
    expect(toError("failed", "fallback").message).toBe("failed");
    expect(toError({ reason: "failed" }, "fallback").message).toBe("fallback");
  });
});
