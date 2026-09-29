import type { RequestOptions } from "@purevm/rpc-transport";

import type { Hash, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcLog } from "./types.js";

export type EthGetFilterChangesParameters = {
  /** Identifier returned by `eth_newFilter`, `eth_newBlockFilter`, or `eth_newPendingTransactionFilter`. */
  filterId: Quantity;
};

/** Block or transaction hashes for hash filters, logs for log filters. */
export type FilterChange = Hash | RpcLog;
type Method<result extends FilterChange> = RpcMethodDefinition<
  "eth_getFilterChanges",
  readonly [Quantity],
  readonly result[]
>;
export function ethGetFilterChanges<
  result extends FilterChange = RpcLog,
  options extends RequestOptions = RequestOptions,
>(
  client: RpcRequester<options>,
  parameters: EthGetFilterChangesParameters,
  requestOptions?: options,
): Promise<readonly result[]> {
  return client.request<Method<result>>(
    { method: "eth_getFilterChanges", params: [parameters.filterId] },
    requestOptions,
  );
}
