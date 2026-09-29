import type { RequestOptions } from "@purevm/rpc-transport";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { LogsByHashFilter, RpcLog } from "./types.js";

type EthGetLogsByHash = RpcMethodDefinition<
  "eth_getLogs",
  readonly [LogsByHashFilter],
  readonly RpcLog[]
>;

export function ethGetLogsByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  filter: LogsByHashFilter,
  requestOptions?: options,
): Promise<readonly RpcLog[]> {
  return client.request<EthGetLogsByHash>(
    { method: "eth_getLogs", params: [filter] },
    requestOptions,
  );
}
