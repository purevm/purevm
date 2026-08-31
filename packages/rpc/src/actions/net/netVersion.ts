import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { NetworkId } from "./types.js";

type NetVersion = RpcMethodDefinition<"net_version", undefined, NetworkId>;

export function netVersion<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<NetworkId> {
  return client.request<NetVersion>({ method: "net_version" }, requestOptions);
}
