import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

type TraceBlockByHash = RpcMethodDefinition<"trace_block", readonly [BlockHash], TraceEntry[]>;

export function traceBlockByHash(
  client: RpcRequester<HttpRequestOptions>,
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<TraceBlockByHash>({ method: "trace_block", params: [blockHash] }, options);
}
