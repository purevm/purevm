import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetCodeByNumberParameters = {
  /** Account whose deployed bytecode should be read. */
  address: Address;
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
};

type Method = RpcMethodDefinition<"eth_getCode", readonly [Address, BlockNumber], Hex>;

export function ethGetCodeByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetCodeByNumberParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    { method: "eth_getCode", params: [parameters.address, parameters.blockNumber] },
    requestOptions,
  );
}
