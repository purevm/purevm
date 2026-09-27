import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"debug_getRawBlock", readonly [BlockTag], Hex>;

/** Returns the RLP-encoded block. */
export function debugGetRawBlockByTag(
  client: RpcRequester<HttpRequestOptions>,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>({ method: "debug_getRawBlock", params: [blockTag] }, options);
}
