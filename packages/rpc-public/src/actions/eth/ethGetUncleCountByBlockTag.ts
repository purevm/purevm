import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetUncleCountByBlockTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<"eth_getUncleCountByBlockNumber", readonly [BlockTag], Quantity>;
export function ethGetUncleCountByBlockTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetUncleCountByBlockTagParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getUncleCountByBlockNumber", params: [parameters.blockTag] },
    requestOptions,
  );
}
