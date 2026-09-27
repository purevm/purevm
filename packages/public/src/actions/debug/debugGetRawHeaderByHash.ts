import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawHeaderByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
};

type Method = RpcMethodDefinition<"debug_getRawHeader", readonly [BlockHash], Hex>;

/** Returns the RLP-encoded block header. */
export function debugGetRawHeaderByHash(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawHeaderByHashParameters,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>(
    { method: "debug_getRawHeader", params: [parameters.blockHash] },
    options,
  );
}
