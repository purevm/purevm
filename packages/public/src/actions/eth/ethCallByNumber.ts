import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "./types.js";

export type EthCallByNumberParameters = {
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
};

type Method = RpcMethodDefinition<"eth_call", readonly [RpcCallRequest, BlockNumber], Hex>;

export function ethCallByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCallByNumberParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    { method: "eth_call", params: [parameters.call, parameters.blockNumber] },
    requestOptions,
  );
}
