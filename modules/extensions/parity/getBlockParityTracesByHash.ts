import type { BlockHash, HttpClient, HttpRequestOptions } from "@purevm/rpc-public";

import type { ParityBlockTracesResult } from "../types.js";
import { formatParityTraces } from "./format-parity-traces.js";

export async function getBlockParityTracesByHash(
  client: HttpClient,
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<ParityBlockTracesResult> {
  return formatParityTraces(await client.traceBlockByHash({ blockHash }, options), blockHash);
}
