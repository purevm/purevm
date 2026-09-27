import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawBlockByNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
};

type Method = RpcMethodDefinition<"debug_getRawBlock", readonly [BlockNumber], Hex>;

/** Returns the RLP-encoded block. */
export function debugGetRawBlockByNumber(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawBlockByNumberParameters,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>(
    { method: "debug_getRawBlock", params: [parameters.blockNumber] },
    options,
  );
}
