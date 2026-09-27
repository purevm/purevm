import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type {
  CallTracerConfig,
  DebugBlockTrace,
  DebugTraceConfig,
  DebugTraceResult,
} from "./types.js";

/** Traces every transaction of the block with this hash. The result type follows `config.tracer`, which defaults to `callTracer`. */
export function debugTraceBlockByHash<const config extends DebugTraceConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  blockHash: BlockHash,
  config?: config,
  options?: HttpRequestOptions,
): Promise<DebugBlockTrace<DebugTraceResult<config>>[]> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceBlockByHash",
      readonly [BlockHash, DebugTraceConfig],
      DebugBlockTrace<DebugTraceResult<config>>[]
    >
  >({ method: "debug_traceBlockByHash", params: [blockHash, config ?? DEFAULT_TRACER] }, options);
}
