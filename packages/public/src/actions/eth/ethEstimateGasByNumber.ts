import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "./types.js";

export type EthEstimateGasByNumberParameters = {
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
  /** Transaction-like call to estimate. */
  call: RpcCallRequest;
};

type Method = RpcMethodDefinition<
  "eth_estimateGas",
  readonly [RpcCallRequest, BlockNumber],
  Quantity
>;

export function ethEstimateGasByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthEstimateGasByNumberParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_estimateGas", params: [parameters.call, parameters.blockNumber] },
    requestOptions,
  );
}
