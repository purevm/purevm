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

export type DebugTraceBlockByHashParameters<config extends DebugTraceConfig = CallTracerConfig> = {
  /** Hash of the target block. */
  blockHash: BlockHash;
  /** Tracer configuration. Defaults to `callTracer`. */
  config?: config | undefined;
};

/** Traces every transaction of the block with this hash. The result type follows `config.tracer`, which defaults to `callTracer`. */
export function debugTraceBlockByHash<const config extends DebugTraceConfig = CallTracerConfig>(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugTraceBlockByHashParameters<config>,
  options?: HttpRequestOptions,
): Promise<readonly DebugBlockTrace<DebugTraceResult<config>>[]> {
  return client.request<
    RpcMethodDefinition<
      "debug_traceBlockByHash",
      readonly [BlockHash, DebugTraceConfig],
      readonly DebugBlockTrace<DebugTraceResult<config>>[]
    >
  >(
    {
      method: "debug_traceBlockByHash",
      params: [parameters.blockHash, parameters.config ?? DEFAULT_TRACER],
    },
    options,
  );
}
