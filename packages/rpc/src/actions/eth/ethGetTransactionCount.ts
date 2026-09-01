import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetTransactionCountParameters = { address: Address; block?: BlockNumberOrTag };
type EthGetTransactionCount = RpcMethodDefinition<
  "eth_getTransactionCount",
  readonly [Address, BlockNumberOrTag],
  Quantity
>;

export function ethGetTransactionCount<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionCountParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthGetTransactionCount>(
    {
      method: "eth_getTransactionCount",
      params: [parameters.address, parameters.block ?? "latest"],
    },
    requestOptions,
  );
}
