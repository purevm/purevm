import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

type TraceBlockByTag = RpcMethodDefinition<"trace_block", readonly [BlockTag], TraceEntry[]>;

export function traceBlockByTag(
  client: RpcRequester<HttpRequestOptions>,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<TraceBlockByTag>({ method: "trace_block", params: [blockTag] }, options);
}
