import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

type Method = RpcMethodDefinition<
  "eth_getTransactionByBlockNumberAndIndex",
  readonly [BlockNumber, Index],
  RpcTransaction | null
>;
export function ethGetTransactionByBlockNumberAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockNumber: BlockNumber,
  index: Index,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<Method>(
    { method: "eth_getTransactionByBlockNumberAndIndex", params: [blockNumber, index] },
    requestOptions,
  );
}
