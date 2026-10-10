import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcAccessListResult, RpcCallRequest } from "./types.js";

export type EthCreateAccessListByTagParameters = {
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Transaction-like call to analyze. */
  call: RpcCallRequest;
};

type Method = RpcMethodDefinition<
  "eth_createAccessList",
  readonly [RpcCallRequest, BlockTag],
  RpcAccessListResult
>;

export function ethCreateAccessListByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCreateAccessListByTagParameters,
  requestOptions?: options,
): Promise<RpcAccessListResult> {
  return client.request<Method>(
    { method: "eth_createAccessList", params: [parameters.call, parameters.blockTag] },
    requestOptions,
  );
}
