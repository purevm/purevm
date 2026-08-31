import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetCodeParameters = {
  address: Address;
  block?: BlockNumberOrTag;
};

type EthGetCode = RpcMethodDefinition<"eth_getCode", readonly [Address, BlockNumberOrTag], Hex>;

export function ethGetCode<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetCodeParameters,
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
