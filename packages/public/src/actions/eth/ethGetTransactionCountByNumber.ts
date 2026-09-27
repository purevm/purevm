import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetTransactionCountByNumberParameters = {
  /** Account whose nonce should be read. */
  address: Address;
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
};

type Method = RpcMethodDefinition<
  "eth_getTransactionCount",
  readonly [Address, BlockNumber],
  Quantity
>;

export function ethGetTransactionCountByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionCountByNumberParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getTransactionCount", params: [parameters.address, parameters.blockNumber] },
    requestOptions,
  );
}
