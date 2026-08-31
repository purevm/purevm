import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { CallTracerConfig, DebugBlockTrace } from "./types.js";

type DebugTraceBlockByTag = RpcMethodDefinition<
  "debug_traceBlockByNumber",
  readonly [BlockTag, CallTracerConfig],
  DebugBlockTrace[]
>;

export function debugTraceBlockByTag(
  client: RpcRequester<HttpRequestOptions>,
  blockTag: BlockTag,
  config: CallTracerConfig = { tracer: "callTracer" },
  options?: HttpRequestOptions,
): Promise<DebugBlockTrace[]> {
  return client.request<DebugTraceBlockByTag>(
    { method: "debug_traceBlockByNumber", params: [blockTag, config] },
    options,
  );
}
