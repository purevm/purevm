import type { BlockNumber, HttpClient, HttpRequestOptions } from "@purevm/public-client";

import type { TracesResult } from "../types.js";
import { formatDebugTraces } from "./format-debug-traces.js";

export async function getBlockDebugTracesByNumber(
  client: HttpClient,
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<TracesResult> {
  return formatDebugTraces(
    await client.debugTraceBlockByNumber(
      { blockNumber, config: { tracer: "callTracer" } },
      options,
    ),
  );
}
