import type { RequestOptions } from "@purevm/transports";

import type { BlockTag, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

type Method = RpcMethodDefinition<
  "eth_getUncleByBlockNumberAndIndex",
  readonly [BlockTag, Index],
  RpcBlock<false> | null
>;
export function ethGetUncleByBlockTagAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockTag: BlockTag,
  index: Index,
  requestOptions?: options,
): Promise<RpcBlock<false> | null> {
  return client.request<Method>(
    { method: "eth_getUncleByBlockNumberAndIndex", params: [blockTag, index] },
    requestOptions,
  );
}
