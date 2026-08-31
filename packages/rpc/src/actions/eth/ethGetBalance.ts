import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetBalanceParameters = {
  address: Address;
  block?: BlockNumberOrTag;
};

type EthGetBalance = RpcMethodDefinition<
  "eth_getBalance",
  readonly [Address, BlockNumberOrTag],
  Quantity
>;

export function ethGetBalance<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBalanceParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthGetBalance>(
    {
      method: "eth_getBalance",
      params: [parameters.address, parameters.block ?? "latest"],
    },
    requestOptions,
  );
}
