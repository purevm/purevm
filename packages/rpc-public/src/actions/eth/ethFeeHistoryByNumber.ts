import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcFeeHistory } from "./types.js";

export type EthFeeHistoryByNumberParameters = {
  /** Number of blocks in the requested range. */
  blockCount: Quantity;
  /** Hex-encoded number of the newest block. */
  blockNumber: BlockNumber;
  /** Ascending priority-fee percentiles to sample. Defaults to none. */
  rewardPercentiles?: readonly number[] | undefined;
};

type Method = RpcMethodDefinition<
  "eth_feeHistory",
  readonly [Quantity, BlockNumber, readonly number[]],
  RpcFeeHistory
>;

export function ethFeeHistoryByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthFeeHistoryByNumberParameters,
  requestOptions?: options,
): Promise<RpcFeeHistory> {
  return client.request<Method>(
    {
      method: "eth_feeHistory",
      params: [parameters.blockCount, parameters.blockNumber, parameters.rewardPercentiles ?? []],
    },
    requestOptions,
  );
}
