import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"net_peerCount", undefined, Quantity>;
export function netPeerCount<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>({ method: "net_peerCount" }, requestOptions);
}
