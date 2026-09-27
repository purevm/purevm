import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type EthMaxPriorityFeePerGas = RpcMethodDefinition<"eth_maxPriorityFeePerGas", undefined, Quantity>;
export function ethMaxPriorityFeePerGas<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthMaxPriorityFeePerGas>(
    { method: "eth_maxPriorityFeePerGas" },
    requestOptions,
  );
}
