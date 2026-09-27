import type { HttpRequestOptions } from "@purevm/transports";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { DebugBadBlock } from "./types.js";

type Method = RpcMethodDefinition<"debug_getBadBlocks", undefined, DebugBadBlock[]>;

/** Returns recent blocks the node rejected as invalid. */
export function debugGetBadBlocks(
  client: RpcRequester<HttpRequestOptions>,
  options?: HttpRequestOptions,
): Promise<DebugBadBlock[]> {
  return client.request<Method>({ method: "debug_getBadBlocks" }, options);
}
