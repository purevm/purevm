import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { LogsByRangeFilter, RpcLog } from "./types.js";

type EthGetLogsByRange = RpcMethodDefinition<
  "eth_getLogs",
  readonly [LogsByRangeFilter],
  readonly RpcLog[]
>;

export function ethGetLogsByRange<options extends RequestOptions>(
  client: RpcRequester<options>,
  filter: LogsByRangeFilter,
  requestOptions?: options,
): Promise<readonly RpcLog[]> {
  return client.request<EthGetLogsByRange>(
    { method: "eth_getLogs", params: [filter] },
    requestOptions,
  );
}
