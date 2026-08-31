import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag, Hex, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type EthChainId = RpcMethodDefinition<"eth_chainId", undefined, Quantity>;
type EthGetBalance = RpcMethodDefinition<
  "eth_getBalance",
  readonly [Address, BlockNumberOrTag],
  Quantity
>;
type EthGetCode = RpcMethodDefinition<"eth_getCode", readonly [Address, BlockNumberOrTag], Hex>;

export type AccountAtBlockParameters = {
  address: Address;
  block?: BlockNumberOrTag;
};

export function ethChainId<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthChainId>({ method: "eth_chainId" }, requestOptions);
}

export function ethGetBalance<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: AccountAtBlockParameters,
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

export function ethGetCode<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: AccountAtBlockParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<EthGetCode>(
    {
      method: "eth_getCode",
      params: [parameters.address, parameters.block ?? "latest"],
    },
    requestOptions,
  );
}
