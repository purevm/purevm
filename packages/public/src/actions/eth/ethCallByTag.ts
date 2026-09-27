import type { RequestOptions } from "@purevm/transports";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcCallRequest } from "./types.js";

export type EthCallByTagParameters = {
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
};

type Method = RpcMethodDefinition<"eth_call", readonly [RpcCallRequest, BlockTag], Hex>;

export function ethCallByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCallByTagParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    { method: "eth_call", params: [parameters.call, parameters.blockTag] },
    requestOptions,
  );
}
