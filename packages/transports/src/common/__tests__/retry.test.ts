import { expect, test, vi } from "vitest";

import { RpcNetworkError } from "../../errors/index.js";
import { resolveRetry, withRetry } from "../retry.js";

test("merges retry options and allows request overrides", () => {
  const retry = resolveRetry(
    { retry: { delayMs: 10, factor: 3, retries: 4 } },
    { retry: { delayMs: 0, retries: 1 } },
  );

  expect(retry).toMatchObject({ delayMs: 0, factor: 3, retries: 1 });
});

test("falls back to defaults for explicitly undefined retry fields", () => {
  const retry = resolveRetry(
    { retry: { delayMs: 10, retries: undefined } },
    { retry: { delayMs: undefined, factor: undefined } },
  );

  expect(retry).toMatchObject({ delayMs: 10, factor: 2, maxDelayMs: 1_000, retries: 2 });
});

test("disables retry from transport or request options", () => {
  expect(resolveRetry({ retry: false }, {})).toBe(false);
  expect(resolveRetry({ retry: { retries: 2 } }, { retry: false })).toBe(false);
  expect(resolveRetry({ retry: false }, { retry: { retries: 1 } })).not.toBe(false);
});

test.each([
  { retries: -1 },
  { retries: 1.5 },
  { delayMs: -1 },
  { maxDelayMs: -1 },
  { factor: 0 },
  { factor: Number.NaN },
])("rejects invalid retry options $retry", (retry) => {
  expect(() => resolveRetry({ retry }, {})).toThrow(RangeError);
});

test("retries retryable failures and reports retry attempts", async () => {
  const operation = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new RpcNetworkError())
    .mockResolvedValue("done");
  const shouldRetry = vi.fn<() => boolean>(() => true);

  const result = withRetry(operation, {
    delayMs: 100,
    factor: 1,
    maxDelayMs: 100,
    retries: 1,
    shouldRetry,
  });

  await vi.advanceTimersByTimeAsync(99);
  expect(operation).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  await expect(result).resolves.toBe("done");
  expect(operation).toHaveBeenCalledTimes(2);
  expect(shouldRetry).toHaveBeenCalledWith(expect.any(RpcNetworkError), 1);
});

test("aborts while waiting to retry", async () => {
  const controller = new AbortController();
  const promise = withRetry(
    async () => {
      queueMicrotask(() => controller.abort("stop"));
      throw new RpcNetworkError();
    },
    { delayMs: 1_000, factor: 1, maxDelayMs: 1_000, retries: 1, shouldRetry: () => true },
    controller.signal,
  );

  await expect(promise).rejects.toEqual(
    expect.objectContaining({ cause: "stop", retryable: false }),
  );
});
