import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"eth_newPendingTransactionFilter", undefined, Quantity>;
export function ethNewPendingTransactionFilter<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>({ method: "eth_newPendingTransactionFilter" }, requestOptions);
}
