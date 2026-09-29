import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

export type EthGetUncleByBlockNumberAndIndexParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
  /** Hex-encoded position within the block. */
  index: Index;
};

type Method = RpcMethodDefinition<
  "eth_getUncleByBlockNumberAndIndex",
  readonly [BlockNumber, Index],
  RpcBlock<false> | null
>;
export function ethGetUncleByBlockNumberAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetUncleByBlockNumberAndIndexParameters,
  requestOptions?: options,
): Promise<RpcBlock<false> | null> {
  return client.request<Method>(
    {
      method: "eth_getUncleByBlockNumberAndIndex",
      params: [parameters.blockNumber, parameters.index],
    },
    requestOptions,
  );
}
