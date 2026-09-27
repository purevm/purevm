import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import type { TraceReplayResult, TraceType } from "./types.js";

export type TraceCallByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
  /** Trace kinds to produce: `trace`, `vmTrace`, and/or `stateDiff`. */
  traceTypes: readonly TraceType[];
};

type Method = RpcMethodDefinition<
  "trace_call",
  readonly [RpcCallRequest, readonly TraceType[], BlockTag],
  TraceReplayResult
>;
export function traceCallByTag(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceCallByTagParameters,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult> {
  return client.request<Method>(
    { method: "trace_call", params: [parameters.call, parameters.traceTypes, parameters.blockTag] },
    options,
  );
}
