import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

type TraceBlockByNumber = RpcMethodDefinition<"trace_block", readonly [BlockNumber], TraceEntry[]>;

export function traceBlockByNumber(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<TraceBlockByNumber>(
    { method: "trace_block", params: [blockNumber] },
    options,
  );
}
