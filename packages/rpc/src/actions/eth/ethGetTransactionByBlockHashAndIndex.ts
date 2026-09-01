import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

type Method = RpcMethodDefinition<
  "eth_getTransactionByBlockHashAndIndex",
  readonly [BlockHash, Index],
  RpcTransaction | null
>;
export function ethGetTransactionByBlockHashAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockHash: BlockHash,
  index: Index,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<Method>(
    { method: "eth_getTransactionByBlockHashAndIndex", params: [blockHash, index] },
    requestOptions,
  );
}
