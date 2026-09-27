import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

type Method = RpcMethodDefinition<
  "eth_getUncleByBlockNumberAndIndex",
  readonly [BlockNumber, Index],
  RpcBlock<false> | null
>;
export function ethGetUncleByBlockNumberAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockNumber: BlockNumber,
  index: Index,
  requestOptions?: options,
): Promise<RpcBlock<false> | null> {
  return client.request<Method>(
    { method: "eth_getUncleByBlockNumberAndIndex", params: [blockNumber, index] },
    requestOptions,
  );
}
