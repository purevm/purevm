import type { RequestOptions } from "@purevm/transports";

import type { Hash, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcLog } from "./types.js";

type FilterResult = Hash | RpcLog;
type Method<result extends FilterResult> = RpcMethodDefinition<
  "eth_getFilterChanges",
  readonly [Quantity],
  result[]
>;
export function ethGetFilterChanges<
  result extends FilterResult = RpcLog,
  options extends RequestOptions = RequestOptions,
>(client: RpcRequester<options>, filterId: Quantity, requestOptions?: options): Promise<result[]> {
  return client.request<Method<result>>(
    { method: "eth_getFilterChanges", params: [filterId] },
    requestOptions,
  );
}
