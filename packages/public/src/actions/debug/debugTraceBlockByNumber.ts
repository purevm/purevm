import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type {
  CallTracerConfig,
  DebugBlockTrace,
  DebugTraceConfig,
  DebugTraceResult,
} from "./types.js";

/** Traces every transaction of the block with this number. The result type follows `config.tracer`, which defaults to `callTracer`. */
export function debugTraceBlockByNumber<const config extends DebugTraceConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumber,
  config?: config,
  options?: HttpRequestOptions,
): Promise<DebugBlockTrace<DebugTraceResult<config>>[]> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceBlockByNumber",
      readonly [BlockNumber, DebugTraceConfig],
      DebugBlockTrace<DebugTraceResult<config>>[]
    >
  >(
    { method: "debug_traceBlockByNumber", params: [blockNumber, config ?? DEFAULT_TRACER] },
    options,
  );
}
