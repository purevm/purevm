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

export type DebugTraceBlockByNumberParameters<config extends DebugTraceConfig = CallTracerConfig> =
  {
    /** Hex-encoded number of the target block. */
    blockNumber: BlockNumber;
    /** Tracer configuration. Defaults to `callTracer`. */
    config?: config | undefined;
  };

/** Traces every transaction of the block with this number. The result type follows `config.tracer`, which defaults to `callTracer`. */
export function debugTraceBlockByNumber<const config extends DebugTraceConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugTraceBlockByNumberParameters<config>,
  options?: HttpRequestOptions,
): Promise<readonly DebugBlockTrace<DebugTraceResult<config>>[]> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceBlockByNumber",
      readonly [BlockNumber, DebugTraceConfig],
      readonly DebugBlockTrace<DebugTraceResult<config>>[]
    >
  >(
    {
      method: "debug_traceBlockByNumber",
      params: [parameters.blockNumber, parameters.config ?? DEFAULT_TRACER],
    },
    options,
  );
}
