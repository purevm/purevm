import { loadEnvFile } from "node:process";

import type { DebugCallFrame } from "../src/actions/debug/types.js";
import { createHttpClient } from "../src/index.js";

loadEnvFile(new URL("../../../.env", import.meta.url));

const url = process.env["BASE_HTTP_URL"];
if (!url) throw new Error("BASE_HTTP_URL is required in the monorepo root .env file");

const timeoutMs = parsePositiveInteger(process.env["PUREVM_TIMEOUT_MS"] ?? "120000");
const client = createHttpClient({ url });

const traces = await client.debugTraceBlockByTag(
  "finalized",
  {
    tracer: "callTracer",
    tracerConfig: { withLog: true },
    timeout: `${Math.max(1, Math.floor(timeoutMs / 1_000) - 5)}s`,
  },
  { timeoutMs },
);

let frameCount = 0;
let logCount = 0;

for (const trace of traces) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(trace.txHash)) {
    throw new Error(`Invalid transaction hash returned by debug tracer: ${trace.txHash}`);
  }

  const counts = countFrameData(trace.result);
  frameCount += counts.frames;
  logCount += counts.logs;
}

process.stdout.write(
  `${JSON.stringify(
    {
      blockTag: "finalized",
      frameCount,
      logCount,
      rpcOrigin: new URL(url).origin,
      transactionCount: traces.length,
      tracer: "callTracer",
      withLog: true,
    },
    null,
    2,
  )}\n`,
);

function countFrameData(root: DebugCallFrame): { frames: number; logs: number } {
  let frames = 0;
  let logs = 0;
  const pending: DebugCallFrame[] = [root];

  while (pending.length > 0) {
    const frame = pending.pop();
    if (!frame) continue;

    frames++;
    logs += frame.logs?.length ?? 0;
    if (frame.calls) pending.push(...frame.calls);
  }

  return { frames, logs };
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`PUREVM_TIMEOUT_MS must be a positive safe integer, received ${value}`);
  }
  return parsed;
}
