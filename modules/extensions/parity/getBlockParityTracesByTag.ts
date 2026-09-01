import type { BlockTag, HttpClient, HttpRequestOptions } from "@purevm/rpc";

import type { ParityBlockTracesResult } from "../types.js";
import { formatParityTraces } from "./format-parity-traces.js";

export async function getBlockParityTracesByTag(
  client: HttpClient,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<ParityBlockTracesResult> {
  return formatParityTraces(await client.traceBlockByTag(blockTag, options));
}
