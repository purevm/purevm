import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TxpoolStatus } from "./types.js";

type Method = RpcMethodDefinition<"txpool_status", undefined, TxpoolStatus>;

/** Returns the number of pending and queued transactions. */
export function txpoolStatus<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<TxpoolStatus> {
  return client.request<Method>({ method: "txpool_status" }, requestOptions);
}
