import type { RequestOptions } from "@purevm/rpc-transport";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcSyncingStatus } from "./subscriptions.js";

type EthSyncing = RpcMethodDefinition<"eth_syncing", undefined, false | RpcSyncingStatus>;
export function ethSyncing<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<false | RpcSyncingStatus> {
  return client.request<EthSyncing>({ method: "eth_syncing" }, requestOptions);
}
