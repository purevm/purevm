/**
 * Integration tests against a real EVM JSON-RPC endpoint.
 *
 * Requirements:
 * - `BASE_HTTP_URL`: HTTP URL of a Base mainnet node. Base is used because it produces a block
 *   every two seconds, so `finalized` blocks always contain logs and transactions to check.
 *   The node must expose the `trace_*` and `debug_*` namespaces (for example an Erigon or Reth
 *   node, or a provider plan with tracing enabled), because `trace_filter` and
 *   `debug_traceBlockByNumber` are exercised.
 * - `PUREVM_TIMEOUT_MS` (optional, default `120000`): per-request timeout. Tracing a whole block
 *   can take tens of seconds on shared providers.
 *
 * Setup: put the variables in the monorepo root `.env` (loaded by `vitest.integ.setup.ts`) or
 * export them in the shell. No other service needs to be started.
 *
 * Run from `packages/public` with `pnpm test:integ`. Unit tests (`pnpm test`) never run these, so
 * they can run in any order relative to them.
 */
import { expect, test } from "vitest";

import { createHttpClient } from "../http-client.js";

const HASH = /^0x[0-9a-fA-F]{64}$/;

function endpoint(): string {
  const url = process.env["BASE_HTTP_URL"];
  if (!url) throw new Error("BASE_HTTP_URL is required. See the header of this file.");
  return url;
}

function timeoutMs(): number {
  const value = Number(process.env["PUREVM_TIMEOUT_MS"] ?? "120000");
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("PUREVM_TIMEOUT_MS must be a positive safe integer.");
  }
  return value;
}

test("eth_getLogs returns complete logs for the finalized block", async () => {
  const client = createHttpClient({ url: endpoint(), timeoutMs: timeoutMs() });

  const logs = await client.ethGetLogsByRange({ fromBlock: "finalized", toBlock: "finalized" });

  expect(logs.length).toBeGreaterThan(0);
  for (const log of logs) {
    expect(log.blockHash).toMatch(HASH);
    expect(log.transactionHash).toMatch(HASH);
    expect(log.blockNumber).toBeDefined();
    expect(log.transactionIndex).toBeDefined();
    expect(log.logIndex).toBeDefined();
  }
});

test("trace_filter returns traces of the finalized block only", async () => {
  const client = createHttpClient({ url: endpoint(), timeoutMs: timeoutMs() });
  const block = await client.ethGetBlockByTag({ blockTag: "finalized" });
  if (!block?.number) throw new Error("The finalized block has no number.");

  const traces = await client.traceFilter({
    count: 10_000,
    fromBlock: block.number,
    toBlock: block.number,
  });

  expect(traces.length).toBeGreaterThan(0);
  for (const trace of traces) {
    expect(trace.blockNumber).toBe(Number(block.number));
    expect(trace.blockHash.toLowerCase()).toBe(block.hash?.toLowerCase());
  }
});

test("debug_traceBlockByNumber returns one call frame per transaction", async () => {
  const limit = timeoutMs();
  const client = createHttpClient({ url: endpoint(), timeoutMs: limit });
  const block = await client.ethGetBlockByTag({ blockTag: "finalized" });
  if (!block?.number) throw new Error("The finalized block has no number.");

  const traces = await client.debugTraceBlockByNumber({
    blockNumber: block.number,
    config: {
      timeout: `${Math.max(1, Math.floor(limit / 1_000) - 5)}s`,
      tracer: "callTracer",
      tracerConfig: { withLog: true },
    },
  });

  expect(traces).toHaveLength(block.transactions.length);
  for (const trace of traces) {
    expect(trace.txHash).toMatch(HASH);
    expect(trace.error).toBeUndefined();
    expect(trace.result?.type).toBeDefined();
  }
});
