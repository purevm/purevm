import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag, Hex, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetStorageAtParameters = {
  address: Address;
  block?: BlockNumberOrTag;
  position: Quantity;
};
type EthGetStorageAt = RpcMethodDefinition<
  "eth_getStorageAt",
  readonly [Address, Quantity, BlockNumberOrTag],
  Hex
>;

export function ethGetStorageAt<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetStorageAtParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<EthGetStorageAt>(
    {
      method: "eth_getStorageAt",
      params: [parameters.address, parameters.position, parameters.block ?? "latest"],
    },
    requestOptions,
  );
}
