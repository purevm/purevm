import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type NetVersion = RpcMethodDefinition<"net_version", undefined, string>;

export function netVersion<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<string> {
  return client.request<NetVersion>({ method: "net_version" }, requestOptions);
}
