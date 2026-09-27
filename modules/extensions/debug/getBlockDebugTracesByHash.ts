import type { BlockHash, HttpClient, HttpRequestOptions } from "@purevm/public";

import type { TracesResult } from "../types.js";
import { formatDebugTraces } from "./format-debug-traces.js";

export async function getBlockDebugTracesByHash(
  client: HttpClient,
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<TracesResult> {
  return formatDebugTraces(
    await client.debugTraceBlockByHash({ blockHash, config: { tracer: "callTracer" } }, options),
  );
}
