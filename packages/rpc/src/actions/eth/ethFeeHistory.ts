import type { RequestOptions } from "@purevm/transports";

import type { BlockNumberOrTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcFeeHistory } from "./types.js";

export type EthFeeHistoryParameters = {
  blockCount: Quantity;
  newestBlock: BlockNumberOrTag;
  rewardPercentiles?: readonly number[];
};
type EthFeeHistory = RpcMethodDefinition<
  "eth_feeHistory",
  readonly [Quantity, BlockNumberOrTag, readonly number[]],
  RpcFeeHistory
>;

export function ethFeeHistory<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthFeeHistoryParameters,
  requestOptions?: options,
): Promise<RpcFeeHistory> {
  return client.request<EthFeeHistory>(
    {
      method: "eth_feeHistory",
      params: [parameters.blockCount, parameters.newestBlock, parameters.rewardPercentiles ?? []],
    },
    requestOptions,
  );
}
