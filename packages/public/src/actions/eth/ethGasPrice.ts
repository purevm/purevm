import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type EthGasPrice = RpcMethodDefinition<"eth_gasPrice", undefined, Quantity>;
export function ethGasPrice<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthGasPrice>({ method: "eth_gasPrice" }, requestOptions);
}
