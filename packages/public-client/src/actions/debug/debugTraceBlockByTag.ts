import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { DEFAULT_TRACER } from "./default-tracer.js";
import type {
  CallTracerConfig,
  DebugBlockTrace,
  DebugTraceConfig,
  DebugTraceResult,
} from "./types.js";

export type DebugTraceBlockByTagParameters<config extends DebugTraceConfig = CallTracerConfig> = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Tracer configuration. Defaults to `callTracer`. */
  config?: config | undefined;
};

/** Traces every transaction of the tagged block. The result type follows `config.tracer`, which defaults to `callTracer`. */
export function debugTraceBlockByTag<const config extends DebugTraceConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugTraceBlockByTagParameters<config>,
  options?: HttpRequestOptions,
): Promise<readonly DebugBlockTrace<DebugTraceResult<config>>[]> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceBlockByNumber",
      readonly [BlockTag, DebugTraceConfig],
      readonly DebugBlockTrace<DebugTraceResult<config>>[]
    >
  >(
    {
      method: "debug_traceBlockByNumber",
      params: [parameters.blockTag, parameters.config ?? DEFAULT_TRACER],
    },
    options,
  );
}
