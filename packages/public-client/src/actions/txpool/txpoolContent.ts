import type { RequestOptions } from "@purevm/rpc-transport";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TxpoolContent } from "./types.js";

type Method = RpcMethodDefinition<"txpool_content", undefined, TxpoolContent>;

/** Returns every pending and queued transaction, keyed by sender and nonce. */
export function txpoolContent<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<TxpoolContent> {
  return client.request<Method>({ method: "txpool_content" }, requestOptions);
}
