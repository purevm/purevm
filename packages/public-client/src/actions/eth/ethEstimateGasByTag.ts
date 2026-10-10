import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toCallParams, type CallParams } from "./call-overrides.js";
import type { RpcCallRequest, StateOverride } from "./types.js";

export type EthEstimateGasByTagParameters = {
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Transaction-like call to estimate. */
  call: RpcCallRequest;
  /** Account state replaced before the call. */
  stateOverrides?: StateOverride | undefined;
};

type Method = RpcMethodDefinition<"eth_estimateGas", CallParams<BlockTag>, Quantity>;

export function ethEstimateGasByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthEstimateGasByTagParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    {
      method: "eth_estimateGas",
      params: toCallParams(parameters.call, parameters.blockTag, parameters.stateOverrides),
    },
    requestOptions,
  );
}
