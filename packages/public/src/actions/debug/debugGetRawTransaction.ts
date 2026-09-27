import type { HttpRequestOptions } from "@purevm/transports";

import type { Hex, TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"debug_getRawTransaction", readonly [TransactionHash], Hex>;

/** Returns the EIP-2718 encoded transaction. */
export function debugGetRawTransaction(
  client: RpcRequester<HttpRequestOptions>,
  transactionHash: TransactionHash,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>(
    { method: "debug_getRawTransaction", params: [transactionHash] },
    options,
  );
}
