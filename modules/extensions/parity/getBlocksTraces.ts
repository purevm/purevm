import type {
  HttpClient,
  HttpRequestOptions,
  TraceEntry,
  TraceFilterParameters,
} from "@purevm/public";

import { ExtensionDataError } from "../errors/index.js";
import type { ParityBlocksTracesResult } from "../types.js";
import { formatParityTraces } from "./format-parity-traces.js";

export async function getBlocksTraces(
  client: HttpClient,
  filter: TraceFilterParameters,
  options?: HttpRequestOptions,
): Promise<ParityBlocksTracesResult> {
  const response = await client.traceFilter(filter, options);
  return { blocks: formatBlocks(response) };
}

function formatBlocks(response: readonly TraceEntry[]): ParityBlocksTracesResult["blocks"] {
  const grouped = new Map<number, TraceEntry[]>();

  for (const trace of response) {
    if (!Number.isSafeInteger(trace.blockNumber) || trace.blockNumber < 0) {
      throw new ExtensionDataError(`Invalid trace block number ${trace.blockNumber}`);
    }
    const traces = grouped.get(trace.blockNumber) ?? [];
    traces.push(trace);
    grouped.set(trace.blockNumber, traces);
  }

  const blocks: ParityBlocksTracesResult["blocks"] = {};
  for (const [blockNumber, traces] of grouped) blocks[blockNumber] = formatParityTraces(traces);
  return blocks;
}
