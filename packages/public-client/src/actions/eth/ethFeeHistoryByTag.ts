import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcFeeHistory } from "./types.js";

export type EthFeeHistoryByTagParameters = {
  /** Number of blocks in the requested range. */
  blockCount: Quantity;
  /** Named newest block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Ascending priority-fee percentiles to sample. Defaults to none. */
  rewardPercentiles?: readonly number[] | undefined;
};

type Method = RpcMethodDefinition<
  "eth_feeHistory",
  readonly [Quantity, BlockTag, readonly number[]],
  RpcFeeHistory
>;

export function ethFeeHistoryByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthFeeHistoryByTagParameters,
  requestOptions?: options,
): Promise<RpcFeeHistory> {
  return client.request<Method>(
    {
      method: "eth_feeHistory",
      params: [parameters.blockCount, parameters.blockTag, parameters.rewardPercentiles ?? []],
    },
    requestOptions,
  );
}
