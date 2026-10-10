import type { RequestOptions } from "@purevm/rpc-transport";

import type { Address, BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetCodeByTagParameters = {
  /** Account whose deployed bytecode should be read. */
  address: Address;
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<"eth_getCode", readonly [Address, BlockTag], Hex>;

export function ethGetCodeByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetCodeByTagParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    { method: "eth_getCode", params: [parameters.address, parameters.blockTag] },
    requestOptions,
  );
}
