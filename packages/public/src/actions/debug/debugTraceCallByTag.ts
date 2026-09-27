import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type { CallTracerConfig, DebugTraceCallConfig, DebugTraceResult } from "./types.js";

export type DebugTraceCallByTagParameters<config extends DebugTraceCallConfig = CallTracerConfig> =
  {
    /** Named target block, such as `latest` or `finalized`. */
    blockTag: BlockTag;
    /** Transaction-like call to execute. */
    call: RpcCallRequest;
    /** Tracer configuration. Defaults to `callTracer`. */
    config?: config | undefined;
  };

/**
 * Traces a call executed on top of the selected block, with optional state and block overrides.
 * The result type follows `config.tracer`, which defaults to `callTracer`.
 */
export function debugTraceCallByTag<const config extends DebugTraceCallConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugTraceCallByTagParameters<config>,
  options?: HttpRequestOptions,
): Promise<DebugTraceResult<config>> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceCall",
      readonly [RpcCallRequest, BlockTag, DebugTraceCallConfig],
      DebugTraceResult<config>
    >
  >(
    {
      method: "debug_traceCall",
      params: [parameters.call, parameters.blockTag, parameters.config ?? DEFAULT_TRACER],
    },
    options,
  );
}
