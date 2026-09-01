import type { HttpRequestOptions } from "@purevm/transports";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { CallTracerConfig, DebugCallFrame } from "./types.js";

type Method = RpcMethodDefinition<
  "debug_traceTransaction",
  readonly [TransactionHash, CallTracerConfig],
  DebugCallFrame
>;
export function debugTraceTransaction(
  client: RpcRequester<HttpRequestOptions>,
  transactionHash: TransactionHash,
  config: CallTracerConfig = { tracer: "callTracer" },
  options?: HttpRequestOptions,
): Promise<DebugCallFrame> {
  return client.request<Method>(
    { method: "debug_traceTransaction", params: [transactionHash, config] },
    options,
  );
}
