import type { RequestOptions } from "@purevm/transports";

import type { BlockNumberOrTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "./types.js";

export type EthCallParameters = { block?: BlockNumberOrTag; call: RpcCallRequest };
type EthCall = RpcMethodDefinition<"eth_call", readonly [RpcCallRequest, BlockNumberOrTag], Hex>;

export function ethCall<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCallParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<EthCall>(
    { method: "eth_call", params: [parameters.call, parameters.block ?? "latest"] },
    requestOptions,
  );
}
