import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumber, Hex, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetStorageAtByNumberParameters = {
  /** Contract whose storage should be read. */
  address: Address;
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
  /** Storage slot index. */
  position: Quantity;
};

type Method = RpcMethodDefinition<
  "eth_getStorageAt",
  readonly [Address, Quantity, BlockNumber],
  Hex
>;

export function ethGetStorageAtByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetStorageAtByNumberParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_getStorageAt",
      params: [parameters.address, parameters.position, parameters.blockNumber],
    },
    requestOptions,
  );
}
