import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type EthChainId = RpcMethodDefinition<"eth_chainId", undefined, Quantity>;

export function ethChainId<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthChainId>({ method: "eth_chainId" }, requestOptions);
}
