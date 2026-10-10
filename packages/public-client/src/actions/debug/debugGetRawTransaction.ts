import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { Hex, TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawTransactionParameters = {
  /** Hash of the target transaction. */
  transactionHash: TransactionHash;
};

type Method = RpcMethodDefinition<"debug_getRawTransaction", readonly [TransactionHash], Hex>;

/** Returns the EIP-2718 encoded transaction. */
export function debugGetRawTransaction(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawTransactionParameters,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>(
    { method: "debug_getRawTransaction", params: [parameters.transactionHash] },
    options,
  );
}
