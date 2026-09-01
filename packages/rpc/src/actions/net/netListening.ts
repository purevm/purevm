import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"net_listening", undefined, boolean>;
export function netListening<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<boolean> {
  return client.request<Method>({ method: "net_listening" }, requestOptions);
}
