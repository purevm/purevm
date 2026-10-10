import type { RequestOptions } from "@purevm/rpc-transport";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type EthBlockNumber = RpcMethodDefinition<"eth_blockNumber", undefined, Quantity>;

export function ethBlockNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthBlockNumber>({ method: "eth_blockNumber" }, requestOptions);
}
