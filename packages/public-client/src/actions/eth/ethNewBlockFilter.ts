import type { RequestOptions } from "@purevm/rpc-transport";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"eth_newBlockFilter", undefined, Quantity>;
export function ethNewBlockFilter<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>({ method: "eth_newBlockFilter" }, requestOptions);
}
