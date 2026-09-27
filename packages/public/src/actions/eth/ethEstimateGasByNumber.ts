import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toCallParams, type CallParams } from "./call-overrides.js";
import type { RpcCallRequest, StateOverride } from "./types.js";

export type EthEstimateGasByNumberParameters = {
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
  /** Transaction-like call to estimate. */
  call: RpcCallRequest;
  /** Account state replaced before the call. */
  stateOverrides?: StateOverride | undefined;
};

type Method = RpcMethodDefinition<"eth_estimateGas", CallParams<BlockNumber>, Quantity>;

export function ethEstimateGasByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthEstimateGasByNumberParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    {
      method: "eth_estimateGas",
      params: toCallParams(parameters.call, parameters.blockNumber, parameters.stateOverrides),
    },
    requestOptions,
  );
}
