import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockHash, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

export type EthGetUncleByBlockHashAndIndexParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
  /** Hex-encoded position within the block. */
  index: Index;
};

type Method = RpcMethodDefinition<
  "eth_getUncleByBlockHashAndIndex",
  readonly [BlockHash, Index],
  RpcBlock<false> | null
>;
export function ethGetUncleByBlockHashAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetUncleByBlockHashAndIndexParameters,
  requestOptions?: options,
): Promise<RpcBlock<false> | null> {
  return client.request<Method>(
    { method: "eth_getUncleByBlockHashAndIndex", params: [parameters.blockHash, parameters.index] },
    requestOptions,
  );
}
