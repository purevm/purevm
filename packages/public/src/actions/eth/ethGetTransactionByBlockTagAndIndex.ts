import type { RequestOptions } from "@purevm/transports";

import type { BlockTag, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

type Method = RpcMethodDefinition<
  "eth_getTransactionByBlockNumberAndIndex",
  readonly [BlockTag, Index],
  RpcTransaction | null
>;
export function ethGetTransactionByBlockTagAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockTag: BlockTag,
  index: Index,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<Method>(
    { method: "eth_getTransactionByBlockNumberAndIndex", params: [blockTag, index] },
    requestOptions,
  );
}
