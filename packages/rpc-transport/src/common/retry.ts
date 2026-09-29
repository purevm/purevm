import { RpcAbortError, isRetryableError } from "../errors/index.js";
import type { RequestOptions, TransportOptions } from "../types.js";

type ResolvedRetryOptions = {
  retries: number;
  delayMs: number;
  maxDelayMs: number;
  factor: number;
  shouldRetry: (error: unknown, attempt: number) => boolean;
};

const DEFAULT_RETRY: ResolvedRetryOptions = {
  retries: 2,
  delayMs: 100,
  maxDelayMs: 1_000,
  factor: 2,
  shouldRetry: isRetryableError,
};

export function resolveRetry(
  transport: TransportOptions,
  request: RequestOptions,
): false | ResolvedRetryOptions {
  const requestRetry = request.retry;
  const transportRetry = transport.retry;
  if (requestRetry === false || (requestRetry === undefined && transportRetry === false)) {
    return false;
  }

  // Field by field, so an explicit `undefined` falls back instead of erasing a default.
  const base = transportRetry === false ? undefined : transportRetry;
  const retry: ResolvedRetryOptions = {
    retries: requestRetry?.retries ?? base?.retries ?? DEFAULT_RETRY.retries,
    delayMs: requestRetry?.delayMs ?? base?.delayMs ?? DEFAULT_RETRY.delayMs,
    maxDelayMs: requestRetry?.maxDelayMs ?? base?.maxDelayMs ?? DEFAULT_RETRY.maxDelayMs,
    factor: requestRetry?.factor ?? base?.factor ?? DEFAULT_RETRY.factor,
    shouldRetry: requestRetry?.shouldRetry ?? base?.shouldRetry ?? DEFAULT_RETRY.shouldRetry,
  };
  if (!Number.isSafeInteger(retry.retries) || retry.retries < 0) {
    throw new RangeError("retry.retries must be a non-negative safe integer.");
  }
  if (
    !Number.isFinite(retry.delayMs) ||
    !Number.isFinite(retry.maxDelayMs) ||
    !Number.isFinite(retry.factor) ||
    retry.delayMs < 0 ||
    retry.maxDelayMs < 0 ||
    retry.factor < 1
  ) {
    throw new RangeError("Retry delays must be non-negative and factor must be at least 1.");
  }
  return retry;
}

export async function withRetry<result>(
  operation: (attempt: number) => Promise<result>,
  retry: false | ResolvedRetryOptions,
  signal?: AbortSignal,
): Promise<result> {
  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) throw new RpcAbortError(signal.reason);

    try {
      return await operation(attempt);
    } catch (error) {
      if (retry === false || attempt >= retry.retries || !retry.shouldRetry(error, attempt + 1)) {
        throw error;
      }

      const delayMs = Math.min(retry.delayMs * retry.factor ** attempt, retry.maxDelayMs);
      await delay(delayMs, signal);
    }
  }
}

async function delay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new RpcAbortError(signal.reason);

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(done, delayMs);

    function done() {
      signal?.removeEventListener("abort", aborted);
      resolve();
    }

    function aborted() {
      clearTimeout(timer);
      reject(new RpcAbortError(signal?.reason));
    }

    signal?.addEventListener("abort", aborted, { once: true });
    if (signal?.aborted) aborted();
  });
}
