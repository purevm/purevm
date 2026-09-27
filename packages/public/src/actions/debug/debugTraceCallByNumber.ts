import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type { CallTracerConfig, DebugTraceCallConfig, DebugTraceResult } from "./types.js";

/**
 * Traces a call executed on top of the selected block, with optional state and block overrides.
 * The result type follows `config.tracer`, which defaults to `callTracer`.
 */
export function debugTraceCallByNumber<
  const config extends DebugTraceCallConfig = CallTracerConfig,
>(
  client: RpcRequester<HttpRequestOptions>,
  call: RpcCallRequest,
  blockNumber: BlockNumber,
  config?: config,
  options?: HttpRequestOptions,
): Promise<DebugTraceResult<config>> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceCall",
      readonly [RpcCallRequest, BlockNumber, DebugTraceCallConfig],
      DebugTraceResult<config>
    >
  >({ method: "debug_traceCall", params: [call, blockNumber, config ?? DEFAULT_TRACER] }, options);
}
