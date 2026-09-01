import type { RequestOptions } from "@purevm/transports";

import type { BlockNumberOrTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcAccessListResult, RpcCallRequest } from "./types.js";

export type EthCreateAccessListParameters = { block?: BlockNumberOrTag; call: RpcCallRequest };
type EthCreateAccessList = RpcMethodDefinition<
  "eth_createAccessList",
  readonly [RpcCallRequest, BlockNumberOrTag],
  RpcAccessListResult
>;

export function ethCreateAccessList<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCreateAccessListParameters,
  requestOptions?: options,
): Promise<RpcAccessListResult> {
  return client.request<EthCreateAccessList>(
    { method: "eth_createAccessList", params: [parameters.call, parameters.block ?? "latest"] },
    requestOptions,
  );
}
