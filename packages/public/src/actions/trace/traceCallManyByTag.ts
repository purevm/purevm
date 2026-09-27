import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceCallManyEntry, TraceReplayResult } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_callMany",
  readonly [readonly TraceCallManyEntry[], BlockTag],
  TraceReplayResult[]
>;
export function traceCallManyByTag(
  client: RpcRequester<HttpRequestOptions>,
  calls: readonly TraceCallManyEntry[],
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult[]> {
  return client.request<Method>({ method: "trace_callMany", params: [calls, blockTag] }, options);
}
