import type { HttpRequestOptions } from "@purevm/transports";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

type Method = RpcMethodDefinition<"trace_transaction", readonly [TransactionHash], TraceEntry[]>;
export function traceTransaction(
  client: RpcRequester<HttpRequestOptions>,
  transactionHash: TransactionHash,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<Method>(
    { method: "trace_transaction", params: [transactionHash] },
    options,
  );
}
