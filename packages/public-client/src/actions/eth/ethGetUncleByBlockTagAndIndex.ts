import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

export type EthGetUncleByBlockTagAndIndexParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Hex-encoded position within the block. */
  index: Index;
};

type Method = RpcMethodDefinition<
  "eth_getUncleByBlockNumberAndIndex",
  readonly [BlockTag, Index],
  RpcBlock<false> | null
>;
export function ethGetUncleByBlockTagAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetUncleByBlockTagAndIndexParameters,
  requestOptions?: options,
): Promise<RpcBlock<false> | null> {
  return client.request<Method>(
    {
      method: "eth_getUncleByBlockNumberAndIndex",
      params: [parameters.blockTag, parameters.index],
    },
    requestOptions,
  );
}
