import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "../eth/types.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type { CallTracerConfig, DebugTraceCallConfig, DebugTraceResult } from "./types.js";

export type DebugTraceCallByHashParameters<config extends DebugTraceCallConfig = CallTracerConfig> =
  {
    /** Hash of the target block. */
    blockHash: BlockHash;
    /** Transaction-like call to execute. */
    call: RpcCallRequest;
    /** Tracer configuration. Defaults to `callTracer`. */
    config?: config | undefined;
  };

/**
 * Traces a call executed on top of the selected block, with optional state and block overrides.
 * The result type follows `config.tracer`, which defaults to `callTracer`.
 */
export function debugTraceCallByHash<const config extends DebugTraceCallConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugTraceCallByHashParameters<config>,
  options?: HttpRequestOptions,
): Promise<DebugTraceResult<config>> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceCall",
      readonly [RpcCallRequest, BlockHash, DebugTraceCallConfig],
      DebugTraceResult<config>
    >
  >(
    {
      method: "debug_traceCall",
      params: [parameters.call, parameters.blockHash, parameters.config ?? DEFAULT_TRACER],
    },
    options,
  );
}
