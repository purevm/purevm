import type { RequestOptions, TransportOptions } from "../types.js";

export const DEFAULT_TIMEOUT_MS = 10_000;

export function resolveTimeout(options: TransportOptions, request: RequestOptions): number {
  const timeoutMs = request.timeoutMs ?? options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2 ** 31 - 1) {
    throw new RangeError("timeoutMs must be a positive timer-safe integer.");
  }

  return timeoutMs;
}
