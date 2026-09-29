import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceTransactionParameters = {
  /** Hash of the target transaction. */
  transactionHash: TransactionHash;
};

type Method = RpcMethodDefinition<
  "trace_transaction",
  readonly [TransactionHash],
  readonly TraceEntry[]
>;
export function traceTransaction(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceTransactionParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceEntry[]> {
  return client.request<Method>(
    { method: "trace_transaction", params: [parameters.transactionHash] },
    options,
  );
}
