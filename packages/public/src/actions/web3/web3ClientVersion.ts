import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"web3_clientVersion", undefined, string>;

/** Returns the node client name and version, such as `Geth/v1.16.0`. */
export function web3ClientVersion<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<string> {
  return client.request<Method>({ method: "web3_clientVersion" }, requestOptions);
}
