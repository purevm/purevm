import type { HttpRequestOptions } from "@purevm/transports";

import type { Quantity, TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_get",
  readonly [TransactionHash, readonly Quantity[]],
  TraceEntry | null
>;
export function traceGet(
  client: RpcRequester<HttpRequestOptions>,
  transactionHash: TransactionHash,
  traceAddress: readonly Quantity[],
  options?: HttpRequestOptions,
): Promise<TraceEntry | null> {
  return client.request<Method>(
    { method: "trace_get", params: [transactionHash, traceAddress] },
    options,
  );
}
