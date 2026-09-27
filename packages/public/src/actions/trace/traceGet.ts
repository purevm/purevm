import type { HttpRequestOptions } from "@purevm/transports";

import type { Quantity, TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceGetParameters = {
  /** Position of the trace in the call tree. */
  traceAddress: readonly Quantity[];
  /** Hash of the target transaction. */
  transactionHash: TransactionHash;
};

type Method = RpcMethodDefinition<
  "trace_get",
  readonly [TransactionHash, readonly Quantity[]],
  TraceEntry | null
>;
export function traceGet(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceGetParameters,
  options?: HttpRequestOptions,
): Promise<TraceEntry | null> {
  return client.request<Method>(
    { method: "trace_get", params: [parameters.transactionHash, parameters.traceAddress] },
    options,
  );
}
