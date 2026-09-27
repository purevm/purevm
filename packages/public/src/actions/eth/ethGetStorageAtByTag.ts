import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockTag, Hex, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetStorageAtByTagParameters = {
  /** Contract whose storage should be read. */
  address: Address;
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Storage slot index. */
  position: Quantity;
};

type Method = RpcMethodDefinition<"eth_getStorageAt", readonly [Address, Quantity, BlockTag], Hex>;

export function ethGetStorageAtByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetStorageAtByTagParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_getStorageAt",
      params: [parameters.address, parameters.position, parameters.blockTag],
    },
    requestOptions,
  );
}
