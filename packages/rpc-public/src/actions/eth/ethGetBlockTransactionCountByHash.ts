import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockHash, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetBlockTransactionCountByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
};

type Method = RpcMethodDefinition<
  "eth_getBlockTransactionCountByHash",
  readonly [BlockHash],
  Quantity
>;
export function ethGetBlockTransactionCountByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBlockTransactionCountByHashParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getBlockTransactionCountByHash", params: [parameters.blockHash] },
    requestOptions,
  );
}
