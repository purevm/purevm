import type { HttpRequestOptions } from "@purevm/transports";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type { CallTracerConfig, DebugTraceConfig, DebugTraceResult } from "./types.js";

/** Traces one mined transaction. The result type follows `config.tracer`, which defaults to `callTracer`. */
export function debugTraceTransaction<const config extends DebugTraceConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  transactionHash: TransactionHash,
  config?: config,
  options?: HttpRequestOptions,
): Promise<DebugTraceResult<config>> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceTransaction",
      readonly [TransactionHash, DebugTraceConfig],
      DebugTraceResult<config>
    >
  >(
    { method: "debug_traceTransaction", params: [transactionHash, config ?? DEFAULT_TRACER] },
    options,
  );
}
