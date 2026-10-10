import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetBlockTransactionCountByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<
  "eth_getBlockTransactionCountByNumber",
  readonly [BlockTag],
  Quantity
>;
export function ethGetBlockTransactionCountByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBlockTransactionCountByTagParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getBlockTransactionCountByNumber", params: [parameters.blockTag] },
    requestOptions,
  );
}
