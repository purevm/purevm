import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { DebugBadBlock } from "./types.js";

type Method = RpcMethodDefinition<"debug_getBadBlocks", undefined, readonly DebugBadBlock[]>;

/** Returns recent blocks the node rejected as invalid. */
export function debugGetBadBlocks(
  client: RpcRequester<HttpRequestOptions>,
  options?: HttpRequestOptions,
): Promise<readonly DebugBadBlock[]> {
  return client.request<Method>({ method: "debug_getBadBlocks" }, options);
}
