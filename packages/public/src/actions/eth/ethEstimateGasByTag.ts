import type { RequestOptions } from "@purevm/transports";

import type { BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "./types.js";

export type EthEstimateGasByTagParameters = {
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Transaction-like call to estimate. */
  call: RpcCallRequest;
};

type Method = RpcMethodDefinition<"eth_estimateGas", readonly [RpcCallRequest, BlockTag], Quantity>;

export function ethEstimateGasByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthEstimateGasByTagParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_estimateGas", params: [parameters.call, parameters.blockTag] },
    requestOptions,
  );
}
