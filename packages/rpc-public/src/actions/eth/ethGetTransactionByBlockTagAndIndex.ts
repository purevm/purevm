import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

export type EthGetTransactionByBlockTagAndIndexParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Hex-encoded position within the block. */
  index: Index;
};

type Method = RpcMethodDefinition<
  "eth_getTransactionByBlockNumberAndIndex",
  readonly [BlockTag, Index],
  RpcTransaction | null
>;
export function ethGetTransactionByBlockTagAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionByBlockTagAndIndexParameters,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<Method>(
    {
      method: "eth_getTransactionByBlockNumberAndIndex",
      params: [parameters.blockTag, parameters.index],
    },
    requestOptions,
  );
}
