import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockHash, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

export type EthGetTransactionByBlockHashAndIndexParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
  /** Hex-encoded position within the block. */
  index: Index;
};

type Method = RpcMethodDefinition<
  "eth_getTransactionByBlockHashAndIndex",
  readonly [BlockHash, Index],
  RpcTransaction | null
>;
export function ethGetTransactionByBlockHashAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionByBlockHashAndIndexParameters,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<Method>(
    {
      method: "eth_getTransactionByBlockHashAndIndex",
      params: [parameters.blockHash, parameters.index],
    },
    requestOptions,
  );
}
