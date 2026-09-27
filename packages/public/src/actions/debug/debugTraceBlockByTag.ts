import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type {
  CallTracerConfig,
  DebugBlockTrace,
  DebugTraceConfig,
  DebugTraceResult,
} from "./types.js";

/** Traces every transaction of the tagged block. The result type follows `config.tracer`, which defaults to `callTracer`. */
export function debugTraceBlockByTag<const config extends DebugTraceConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  blockTag: BlockTag,
  config?: config,
  options?: HttpRequestOptions,
): Promise<DebugBlockTrace<DebugTraceResult<config>>[]> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceBlockByNumber",
      readonly [BlockTag, DebugTraceConfig],
      DebugBlockTrace<DebugTraceResult<config>>[]
    >
  >({ method: "debug_traceBlockByNumber", params: [blockTag, config ?? DEFAULT_TRACER] }, options);
}
