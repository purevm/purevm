import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"debug_getRawHeader", readonly [BlockTag], Hex>;

/** Returns the RLP-encoded block header. */
export function debugGetRawHeaderByTag(
  client: RpcRequester<HttpRequestOptions>,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>({ method: "debug_getRawHeader", params: [blockTag] }, options);
}
