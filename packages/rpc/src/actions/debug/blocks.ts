import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash, BlockNumberOrTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { CallTracerConfig, DebugBlockTrace } from "./types.js";

type DebugTraceBlockByHash = RpcMethodDefinition<
  "debug_traceBlockByHash",
  readonly [BlockHash, CallTracerConfig],
  DebugBlockTrace[]
>;
type DebugTraceBlockByNumber = RpcMethodDefinition<
  "debug_traceBlockByNumber",
  readonly [BlockNumberOrTag, CallTracerConfig],
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

export function debugTraceBlockByNumber(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumberOrTag,
  config: CallTracerConfig = { tracer: "callTracer" },
  options?: HttpRequestOptions,
): Promise<DebugBlockTrace[]> {
  return client.request<DebugTraceBlockByNumber>(
    { method: "debug_traceBlockByNumber", params: [blockNumber, config] },
    options,
  );
}
