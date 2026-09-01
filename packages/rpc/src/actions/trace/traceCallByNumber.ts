import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import type { TraceReplayResult, TraceType } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_call",
  readonly [RpcCallRequest, readonly TraceType[], BlockNumber],
  TraceReplayResult
>;
export function traceCallByNumber(
  client: RpcRequester<HttpRequestOptions>,
  call: RpcCallRequest,
  traceTypes: readonly TraceType[],
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult> {
  return client.request<Method>(
    { method: "trace_call", params: [call, traceTypes, blockNumber] },
    options,
  );
}
