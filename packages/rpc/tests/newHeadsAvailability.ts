import { loadEnvFile } from "node:process";

import {
  createHttpClient,
  createWebSocketClient,
  type BlockNumber,
  type NewHeadsSubscriptionResult,
  type RpcSubscription,
} from "../src/index.js";
import type { Availability, BlockMeasurement, MethodName } from "./newHeadsAvailability.types.js";
import {
  deferred,
  errorMessage,
  positiveIntegerEnv,
  quantityToSafeNumber,
  requiredEnv,
  sleep,
  summarize,
  writeJson,
} from "./newHeadsAvailability.utils.js";

loadEnvFile(new URL("../../../.env", import.meta.url));

const httpUrl = requiredEnv("BASE_HTTP_URL");
const websocketUrl = requiredEnv("BASE_WS_URL");
const sampleBlocks = positiveIntegerEnv("PUREVM_SAMPLE_BLOCKS", 100);
const probeIntervalMs = positiveIntegerEnv("PUREVM_PROBE_INTERVAL_MS", 250);
const probeTimeoutMs = positiveIntegerEnv("PUREVM_PROBE_TIMEOUT_MS", 60_000);
const requestTimeoutMs = positiveIntegerEnv("PUREVM_REQUEST_TIMEOUT_MS", 15_000);

const http = createHttpClient({ retry: false, timeoutMs: requestTimeoutMs, url: httpUrl });
const websocket = createWebSocketClient({
  onError: fail,
  retry: false,
  timeoutMs: requestTimeoutMs,
  url: websocketUrl,
});
const completion = deferred<void>();
const measurements: BlockMeasurement[] = [];
const seenHashes = new Set<string>();
let acceptedBlocks = 0;
let subscription: RpcSubscription | undefined;
let stopping = false;

process.once("SIGINT", () => fail(new Error("Interrupted")));

try {
  subscription = await websocket.ethSubscribeNewHeads({
    onData: (head) => {
      void acceptHead(head).catch(fail);
    },
    onError: fail,
  });
  writeJson({
    event: "subscribed",
    httpOrigin: new URL(httpUrl).origin,
    sampleBlocks,
    websocketOrigin: new URL(websocketUrl).origin,
  });
  await completion.promise;
  writeJson(summarize(measurements));
} finally {
  stopping = true;
  if (subscription) await subscription.unsubscribe().catch(() => false);
  websocket.close();
}

async function acceptHead(head: NewHeadsSubscriptionResult): Promise<void> {
  if (stopping || acceptedBlocks >= sampleBlocks) return;
  if (!head.number || !head.hash) throw new Error("newHeads returned a pending block");

  const normalizedHash = head.hash.toLowerCase();
  if (seenHashes.has(normalizedHash)) return;
  seenHashes.add(normalizedHash);
  acceptedBlocks++;

  const receivedAtMs = Date.now();
  const mintedAtMs = quantityToSafeNumber(head.timestamp, "block timestamp") * 1_000;
  const methods = await Promise.all([
    probe("debug_traceBlockByNumber", receivedAtMs, mintedAtMs, () =>
      http.debugTraceBlockByNumber(
        head.number as BlockNumber,
        {
          tracer: "callTracer",
          tracerConfig: { withLog: true },
          timeout: `${Math.max(1, Math.floor(requestTimeoutMs / 1_000) - 1)}s`,
        },
        { timeoutMs: requestTimeoutMs },
      ),
    ),
    probe("eth_getLogs", receivedAtMs, mintedAtMs, () =>
      http.ethGetLogsByRange(
        { fromBlock: head.number as BlockNumber, toBlock: head.number as BlockNumber },
        { timeoutMs: requestTimeoutMs },
      ),
    ),
    probe("trace_filter", receivedAtMs, mintedAtMs, () =>
      http.traceFilter(
        {
          count: 10_000,
          fromBlock: head.number as BlockNumber,
          toBlock: head.number as BlockNumber,
        },
        { timeoutMs: requestTimeoutMs },
      ),
    ),
  ]);

  const measurement: BlockMeasurement = {
    blockHash: normalizedHash,
    blockNumber: head.number as BlockNumber,
    methods,
    mintedAt: new Date(mintedAtMs).toISOString(),
    receivedAt: new Date(receivedAtMs).toISOString(),
    receivedAfterMintMs: receivedAtMs - mintedAtMs,
  };
  measurements.push(measurement);
  writeJson({ event: "block-measured", ...measurement });

  if (measurements.length === sampleBlocks) completion.resolve();
}

async function probe<result extends readonly unknown[]>(
  method: MethodName,
  receivedAtMs: number,
  mintedAtMs: number,
  request: () => Promise<result>,
): Promise<Availability> {
  const deadline = receivedAtMs + probeTimeoutMs;
  let attempts: number = 0;
  let lastError: unknown;

  while (Date.now() < deadline) {
    attempts++;
    try {
      const result = await request();
      if (result.length > 0) {
        const availableAtMs = Date.now();
        return {
          afterHeadMs: availableAtMs - receivedAtMs,
          afterMintMs: availableAtMs - mintedAtMs,
          attempts,
          availableAt: new Date(availableAtMs).toISOString(),
          itemCount: result.length,
          method,
        };
      }
      lastError = new Error(`${method} returned no data`);
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.min(probeIntervalMs, Math.max(0, deadline - Date.now())));
  }

  throw new Error(
    `${method} was unavailable for block after ${probeTimeoutMs}ms: ${errorMessage(lastError)}`,
    { cause: lastError },
  );
}

function fail(error: Error): void {
  if (stopping) return;
  stopping = true;
  completion.reject(error);
}
