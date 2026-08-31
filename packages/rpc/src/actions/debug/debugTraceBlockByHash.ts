import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { CallTracerConfig, DebugBlockTrace } from "./types.js";

type DebugTraceBlockByHash = RpcMethodDefinition<
  "debug_traceBlockByHash",
  readonly [BlockHash, CallTracerConfig],
  DebugBlockTrace[]
>;

export function debugTraceBlockByHash(
  client: RpcRequester<HttpRequestOptions>,
  blockHash: BlockHash,
  config: CallTracerConfig = { tracer: "callTracer" },
  options?: HttpRequestOptions,
): Promise<DebugBlockTrace[]> {
  return client.request<DebugTraceBlockByHash>(
    { method: "debug_traceBlockByHash", params: [blockHash, config] },
    options,
  );
}
