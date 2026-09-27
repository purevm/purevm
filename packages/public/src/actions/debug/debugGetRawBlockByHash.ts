import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawBlockByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
};

type Method = RpcMethodDefinition<"debug_getRawBlock", readonly [BlockHash], Hex>;

/** Returns the RLP-encoded block. */
export function debugGetRawBlockByHash(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawBlockByHashParameters,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>(
    { method: "debug_getRawBlock", params: [parameters.blockHash] },
    options,
  );
}
