import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceBlockByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type TraceBlockByTag = RpcMethodDefinition<
  "trace_block",
  readonly [BlockTag],
  readonly TraceEntry[]
>;

export function traceBlockByTag(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceBlockByTagParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceEntry[]> {
  return client.request<TraceBlockByTag>(
    { method: "trace_block", params: [parameters.blockTag] },
    options,
  );
}
