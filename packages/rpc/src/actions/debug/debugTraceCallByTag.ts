import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import type { CallTracerConfig, DebugCallFrame } from "./types.js";

type Method = RpcMethodDefinition<
  "debug_traceCall",
  readonly [RpcCallRequest, BlockTag, CallTracerConfig],
  DebugCallFrame
>;
export function debugTraceCallByTag(
  client: RpcRequester<HttpRequestOptions>,
  call: RpcCallRequest,
  blockTag: BlockTag,
  config: CallTracerConfig = { tracer: "callTracer" },
  options?: HttpRequestOptions,
): Promise<DebugCallFrame> {
  return client.request<Method>(
    { method: "debug_traceCall", params: [call, blockTag, config] },
    options,
  );
}
