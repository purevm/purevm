import type { ReconnectOptions } from "./types.js";

export type ResolvedReconnectOptions = {
  retries: number;
  delayMs: number;
  maxDelayMs: number;
  factor: number;
};

const DEFAULT_RECONNECT: ResolvedReconnectOptions = {
  retries: Number.POSITIVE_INFINITY,
  delayMs: 100,
  maxDelayMs: 30_000,
  factor: 2,
};

export function resolveReconnect(
  options: false | ReconnectOptions | undefined,
): false | ResolvedReconnectOptions {
  if (options === false) return false;

  const reconnect = {
    retries: options?.retries ?? DEFAULT_RECONNECT.retries,
    delayMs: options?.delayMs ?? DEFAULT_RECONNECT.delayMs,
    maxDelayMs: options?.maxDelayMs ?? DEFAULT_RECONNECT.maxDelayMs,
    factor: options?.factor ?? DEFAULT_RECONNECT.factor,
  };
  if (
    reconnect.retries !== Number.POSITIVE_INFINITY &&
    (!Number.isSafeInteger(reconnect.retries) || reconnect.retries < 0)
  ) {
    throw new RangeError("reconnect.retries must be a non-negative safe integer or Infinity.");
  }
  if (
    !Number.isFinite(reconnect.delayMs) ||
    !Number.isFinite(reconnect.maxDelayMs) ||
    !Number.isFinite(reconnect.factor) ||
    reconnect.delayMs < 0 ||
    reconnect.maxDelayMs < 0 ||
    reconnect.factor < 1
  ) {
    throw new RangeError("Reconnect delays must be non-negative and factor must be at least 1.");
  }
  return reconnect;
}
