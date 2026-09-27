import type { BlockNumber, HttpClient, HttpRequestOptions } from "@purevm/public";

import type { ParityBlockTracesResult } from "../types.js";
import { formatParityTraces } from "./format-parity-traces.js";

export async function getBlockParityTracesByNumber(
  client: HttpClient,
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<ParityBlockTracesResult> {
  return formatParityTraces(await client.traceBlockByNumber({ blockNumber }, options));
}
