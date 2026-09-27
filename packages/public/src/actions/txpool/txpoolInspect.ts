import type { RequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TxpoolInspect } from "./types.js";

type Method = RpcMethodDefinition<"txpool_inspect", undefined, TxpoolInspect>;

/** Returns a textual summary of every pending and queued transaction. */
export function txpoolInspect<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<TxpoolInspect> {
  return client.request<Method>({ method: "txpool_inspect" }, requestOptions);
}
