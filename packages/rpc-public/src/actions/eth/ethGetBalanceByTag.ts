import type { RequestOptions } from "@purevm/rpc-transport";

import type { Address, BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetBalanceByTagParameters = {
  /** Account whose balance should be read. */
  address: Address;
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<"eth_getBalance", readonly [Address, BlockTag], Quantity>;

export function ethGetBalanceByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBalanceByTagParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getBalance", params: [parameters.address, parameters.blockTag] },
    requestOptions,
  );
}
