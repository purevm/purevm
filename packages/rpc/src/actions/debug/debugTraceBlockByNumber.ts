import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { CallTracerConfig, DebugBlockTrace } from "./types.js";

type DebugTraceBlockByNumber = RpcMethodDefinition<
  "debug_traceBlockByNumber",
  readonly [BlockNumber, CallTracerConfig],
  DebugBlockTrace[]
>;

export function debugTraceBlockByNumber(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumber,
  config: CallTracerConfig = { tracer: "callTracer" },
  options?: HttpRequestOptions,
): Promise<DebugBlockTrace[]> {
  return client.request<DebugTraceBlockByNumber>(
    { method: "debug_traceBlockByNumber", params: [blockNumber, config] },
    options,
  );
}
