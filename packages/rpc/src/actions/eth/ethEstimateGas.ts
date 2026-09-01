import type { RequestOptions } from "@purevm/transports";

import type { BlockNumberOrTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "./types.js";

export type EthEstimateGasParameters = { block?: BlockNumberOrTag; call: RpcCallRequest };
type EthEstimateGas = RpcMethodDefinition<
  "eth_estimateGas",
  readonly [RpcCallRequest, BlockNumberOrTag],
  Quantity
>;

export function ethEstimateGas<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthEstimateGasParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthEstimateGas>(
    { method: "eth_estimateGas", params: [parameters.call, parameters.block ?? "latest"] },
    requestOptions,
  );
}
