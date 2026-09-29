import type { RequestOptions } from "@purevm/rpc-transport";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcLog } from "./types.js";

export type EthGetFilterLogsParameters = {
  /** Identifier returned by `eth_newFilter`, `eth_newBlockFilter`, or `eth_newPendingTransactionFilter`. */
  filterId: Quantity;
};

type Method = RpcMethodDefinition<"eth_getFilterLogs", readonly [Quantity], readonly RpcLog[]>;
export function ethGetFilterLogs<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetFilterLogsParameters,
  requestOptions?: options,
): Promise<readonly RpcLog[]> {
  return client.request<Method>(
    { method: "eth_getFilterLogs", params: [parameters.filterId] },
    requestOptions,
  );
}
