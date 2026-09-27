import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawBlockByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<"debug_getRawBlock", readonly [BlockTag], Hex>;

/** Returns the RLP-encoded block. */
export function debugGetRawBlockByTag(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawBlockByTagParameters,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>(
    { method: "debug_getRawBlock", params: [parameters.blockTag] },
    options,
  );
}
