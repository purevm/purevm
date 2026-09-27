import type { BlockMeasurement, MethodName } from "./newHeadsAvailability.types.js";

const METHODS: readonly MethodName[] = ["debug_traceBlockByNumber", "eth_getLogs", "trace_filter"];

export function summarize(blocks: readonly BlockMeasurement[]): object {
  const receivedAfterMint = blocks.map((block) => block.receivedAfterMintMs);
  return {
    blockCount: blocks.length,
    event: "summary",
    headReception: {
      averageAfterMintMs: average(receivedAfterMint),
      maximumAfterMintMs: maximum(receivedAfterMint),
      medianAfterMintMs: median(receivedAfterMint),
      minimumAfterMintMs: minimum(receivedAfterMint),
    },
    methods: METHODS.map((method) => {
      const values = blocks.flatMap((block) =>
        block.methods.filter((measurement) => measurement.method === method),
      );
      const afterHead = values.map((value) => value.afterHeadMs);
      const afterMint = values.map((value) => value.afterMintMs);
      const attempts = values.map((value) => value.attempts);
      return {
        averageAfterHeadMs: average(afterHead),
        averageAfterMintMs: average(afterMint),
        averageAttempts: average(attempts),
        maximumAfterHeadMs: maximum(afterHead),
        maximumAfterMintMs: maximum(afterMint),
        maximumAttempts: maximum(attempts),
        medianAfterHeadMs: median(afterHead),
        medianAfterMintMs: median(afterMint),
        medianAttempts: median(attempts),
        method,
        minimumAfterHeadMs: minimum(afterHead),
        minimumAfterMintMs: minimum(afterMint),
        minimumAttempts: minimum(attempts),
      };
    }),
  };
}

export function deferred<value>(): {
  promise: Promise<value>;
  reject(reason?: unknown): void;
  resolve(value: value | PromiseLike<value>): void;
} {
  let rejectDeferred: (reason?: unknown) => void = throwUninitializedDeferred;
  let resolveDeferred: (value: value | PromiseLike<value>) => void = throwUninitializedDeferred;
  const promise = new Promise<value>((resolve, reject) => {
    rejectDeferred = reject;
    resolveDeferred = resolve;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

export function quantityToSafeNumber(value: string, label: string): number {
  const parsed = Number(BigInt(value));
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`Invalid ${label}: ${value}`);
  return parsed;
}

export function positiveIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive safe integer, received ${value}`);
  }
  return parsed;
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in the monorepo root .env file`);
  return value;
}

export function toWebsocketUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol === "https:") url.protocol = "wss:";
  else if (url.protocol === "http:") url.protocol = "ws:";
  else throw new Error(`ETH_HTTP_URL must use http: or https:, received ${url.protocol}`);
  return url.href;
}

export function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function average(values: readonly number[]): number {
  return roundToTwo(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function median(values: readonly number[]): number {
  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const right = sorted[middle];
  if (right === undefined) throw new Error("Cannot calculate the median of an empty collection");
  if (sorted.length % 2 === 1) return right;

  const left = sorted[middle - 1];
  if (left === undefined) throw new Error("Cannot calculate the median of an empty collection");
  return roundToTwo((left + right) / 2);
}

function maximum(values: readonly number[]): number {
  const first = values[0];
  if (first === undefined) throw new Error("Cannot calculate the maximum of an empty collection");
  return values.reduce((highest, value) => Math.max(highest, value), first);
}

function minimum(values: readonly number[]): number {
  const first = values[0];
  if (first === undefined) throw new Error("Cannot calculate the minimum of an empty collection");
  return values.reduce((lowest, value) => Math.min(lowest, value), first);
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function throwUninitializedDeferred(): never {
  throw new Error("Deferred promise is not initialized");
}
