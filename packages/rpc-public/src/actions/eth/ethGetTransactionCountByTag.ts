import type { RequestOptions } from "@purevm/rpc-transport";

import type { Address, BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetTransactionCountByTagParameters = {
  /** Account whose nonce should be read. */
  address: Address;
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<
  "eth_getTransactionCount",
  readonly [Address, BlockTag],
  Quantity
>;

export function ethGetTransactionCountByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionCountByTagParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getTransactionCount", params: [parameters.address, parameters.blockTag] },
    requestOptions,
  );
}
