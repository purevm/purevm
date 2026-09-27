import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<
  "eth_getBlockTransactionCountByHash",
  readonly [BlockHash],
  Quantity
>;
export function ethGetBlockTransactionCountByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockHash: BlockHash,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getBlockTransactionCountByHash", params: [blockHash] },
    requestOptions,
  );
}
