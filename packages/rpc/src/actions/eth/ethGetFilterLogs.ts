import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcLog } from "./types.js";

type Method = RpcMethodDefinition<"eth_getFilterLogs", readonly [Quantity], RpcLog[]>;
export function ethGetFilterLogs<options extends RequestOptions>(
  client: RpcRequester<options>,
  filterId: Quantity,
  requestOptions?: options,
): Promise<RpcLog[]> {
  return client.request<Method>(
    { method: "eth_getFilterLogs", params: [filterId] },
    requestOptions,
  );
}
