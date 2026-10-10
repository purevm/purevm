import type { RequestOptions } from "@purevm/rpc-transport";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { LogsByRangeFilter } from "./types.js";

type Method = RpcMethodDefinition<"eth_newFilter", readonly [LogsByRangeFilter], Quantity>;
export function ethNewFilter<options extends RequestOptions>(
  client: RpcRequester<options>,
  filter: LogsByRangeFilter,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>({ method: "eth_newFilter", params: [filter] }, requestOptions);
}
