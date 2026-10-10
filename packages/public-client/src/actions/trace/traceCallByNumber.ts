import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import type { TraceReplayResult, TraceType } from "./types.js";

export type TraceCallByNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
  /** Trace kinds to produce: `trace`, `vmTrace`, and/or `stateDiff`. */
  traceTypes: readonly TraceType[];
};

type Method = RpcMethodDefinition<
  "trace_call",
  readonly [RpcCallRequest, readonly TraceType[], BlockNumber],
  TraceReplayResult
>;
export function traceCallByNumber(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceCallByNumberParameters,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult> {
  return client.request<Method>(
    {
      method: "trace_call",
      params: [parameters.call, parameters.traceTypes, parameters.blockNumber],
    },
    options,
  );
}
