import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawHeaderByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<"debug_getRawHeader", readonly [BlockTag], Hex>;

/** Returns the RLP-encoded block header. */
export function debugGetRawHeaderByTag(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawHeaderByTagParameters,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>(
    { method: "debug_getRawHeader", params: [parameters.blockTag] },
    options,
  );
}
