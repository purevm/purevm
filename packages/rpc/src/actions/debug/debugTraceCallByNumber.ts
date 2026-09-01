import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import type { CallTracerConfig, DebugCallFrame } from "./types.js";

type Method = RpcMethodDefinition<
  "debug_traceCall",
  readonly [RpcCallRequest, BlockNumber, CallTracerConfig],
  DebugCallFrame
>;
export function debugTraceCallByNumber(
  client: RpcRequester<HttpRequestOptions>,
  call: RpcCallRequest,
  blockNumber: BlockNumber,
  config: CallTracerConfig = { tracer: "callTracer" },
  options?: HttpRequestOptions,
): Promise<DebugCallFrame> {
  return client.request<Method>(
    { method: "debug_traceCall", params: [call, blockNumber, config] },
    options,
  );
}
