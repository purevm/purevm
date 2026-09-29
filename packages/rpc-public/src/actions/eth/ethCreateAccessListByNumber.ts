import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcAccessListResult, RpcCallRequest } from "./types.js";

export type EthCreateAccessListByNumberParameters = {
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
  /** Transaction-like call to analyze. */
  call: RpcCallRequest;
};

type Method = RpcMethodDefinition<
  "eth_createAccessList",
  readonly [RpcCallRequest, BlockNumber],
  RpcAccessListResult
>;

export function ethCreateAccessListByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCreateAccessListByNumberParameters,
  requestOptions?: options,
): Promise<RpcAccessListResult> {
  return client.request<Method>(
    { method: "eth_createAccessList", params: [parameters.call, parameters.blockNumber] },
    requestOptions,
  );
}
