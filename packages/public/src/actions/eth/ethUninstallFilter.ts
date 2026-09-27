import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type EthUninstallFilterParameters = {
  /** Identifier returned by `eth_newFilter`, `eth_newBlockFilter`, or `eth_newPendingTransactionFilter`. */
  filterId: Quantity;
};

type Method = RpcMethodDefinition<"eth_uninstallFilter", readonly [Quantity], boolean>;
export function ethUninstallFilter<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthUninstallFilterParameters,
  requestOptions?: options,
): Promise<boolean> {
  return client.request<Method>(
    { method: "eth_uninstallFilter", params: [parameters.filterId] },
    requestOptions,
  );
}
