import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"eth_uninstallFilter", readonly [Quantity], boolean>;
export function ethUninstallFilter<options extends RequestOptions>(
  client: RpcRequester<options>,
  filterId: Quantity,
  requestOptions?: options,
): Promise<boolean> {
  return client.request<Method>(
    { method: "eth_uninstallFilter", params: [filterId] },
    requestOptions,
  );
}
