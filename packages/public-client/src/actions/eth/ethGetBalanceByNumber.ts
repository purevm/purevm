import type { RequestOptions } from "@purevm/rpc-transport";

import type { Address, BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetBalanceByNumberParameters = {
  /** Account whose balance should be read. */
  address: Address;
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
};

type Method = RpcMethodDefinition<"eth_getBalance", readonly [Address, BlockNumber], Quantity>;

export function ethGetBalanceByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBalanceByNumberParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getBalance", params: [parameters.address, parameters.blockNumber] },
    requestOptions,
  );
}
