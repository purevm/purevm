import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import type { TraceReplayResult, TraceType } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_call",
  readonly [RpcCallRequest, readonly TraceType[], BlockTag],
  TraceReplayResult
>;
export function traceCallByTag(
  client: RpcRequester<HttpRequestOptions>,
  call: RpcCallRequest,
  traceTypes: readonly TraceType[],
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult> {
  return client.request<Method>(
    { method: "trace_call", params: [call, traceTypes, blockTag] },
    options,
  );
}
