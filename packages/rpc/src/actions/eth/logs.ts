import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { LogsByHashFilter, LogsByRangeFilter, RpcLog } from "./types.js";

type EthGetLogsByHash = RpcMethodDefinition<"eth_getLogs", readonly [LogsByHashFilter], RpcLog[]>;
type EthGetLogsByRange = RpcMethodDefinition<"eth_getLogs", readonly [LogsByRangeFilter], RpcLog[]>;

export function ethGetLogsByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  filter: LogsByHashFilter,
  requestOptions?: options,
): Promise<RpcLog[]> {
  return client.request<EthGetLogsByHash>(
    { method: "eth_getLogs", params: [filter] },
    requestOptions,
  );
}

export function ethGetLogsByRange<options extends RequestOptions>(
  client: RpcRequester<options>,
  filter: LogsByRangeFilter,
  requestOptions?: options,
): Promise<RpcLog[]> {
  return client.request<EthGetLogsByRange>(
    { method: "eth_getLogs", params: [filter] },
    requestOptions,
  );
}
