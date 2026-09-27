import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthGetUncleCountByBlockHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
};

type Method = RpcMethodDefinition<"eth_getUncleCountByBlockHash", readonly [BlockHash], Quantity>;
export function ethGetUncleCountByBlockHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetUncleCountByBlockHashParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getUncleCountByBlockHash", params: [parameters.blockHash] },
    requestOptions,
  );
}
