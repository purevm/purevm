import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

type Method = RpcMethodDefinition<
  "eth_getUncleByBlockHashAndIndex",
  readonly [BlockHash, Index],
  RpcBlock<false> | null
>;
export function ethGetUncleByBlockHashAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockHash: BlockHash,
  index: Index,
  requestOptions?: options,
): Promise<RpcBlock<false> | null> {
  return client.request<Method>(
    { method: "eth_getUncleByBlockHashAndIndex", params: [blockHash, index] },
    requestOptions,
  );
}
