import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceCallManyEntry, TraceReplayResult } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_callMany",
  readonly [readonly TraceCallManyEntry[], BlockHash],
  TraceReplayResult[]
>;
export function traceCallManyByHash(
  client: RpcRequester<HttpRequestOptions>,
  calls: readonly TraceCallManyEntry[],
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult[]> {
  return client.request<Method>({ method: "trace_callMany", params: [calls, blockHash] }, options);
}
