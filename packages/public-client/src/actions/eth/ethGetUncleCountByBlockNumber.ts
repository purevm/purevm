import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetUncleCountByBlockNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
};

type Method = RpcMethodDefinition<
  "eth_getUncleCountByBlockNumber",
  readonly [BlockNumber],
  Quantity
>;
export function ethGetUncleCountByBlockNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetUncleCountByBlockNumberParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getUncleCountByBlockNumber", params: [parameters.blockNumber] },
    requestOptions,
  );
}
