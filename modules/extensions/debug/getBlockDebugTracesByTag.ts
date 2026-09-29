import type { BlockTag, HttpClient, HttpRequestOptions } from "@purevm/rpc-public";

import type { TracesResult } from "../types.js";
import { formatDebugTraces } from "./format-debug-traces.js";

export async function getBlockDebugTracesByTag(
  client: HttpClient,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<TracesResult> {
  return formatDebugTraces(
    await client.debugTraceBlockByTag({ blockTag, config: { tracer: "callTracer" } }, options),
  );
}
