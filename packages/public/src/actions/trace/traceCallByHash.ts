import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import type { TraceReplayResult, TraceType } from "./types.js";

export type TraceCallByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
  /** Trace kinds to produce: `trace`, `vmTrace`, and/or `stateDiff`. */
  traceTypes: readonly TraceType[];
};

type Method = RpcMethodDefinition<
  "trace_call",
  readonly [RpcCallRequest, readonly TraceType[], BlockHash],
  TraceReplayResult
>;
export function traceCallByHash(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceCallByHashParameters,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult> {
  return client.request<Method>(
    {
      method: "trace_call",
      params: [parameters.call, parameters.traceTypes, parameters.blockHash],
    },
    options,
  );
}
