import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"debug_getRawBlock", readonly [BlockNumber], Hex>;

/** Returns the RLP-encoded block. */
export function debugGetRawBlockByNumber(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<Hex> {
  return client.request<Method>({ method: "debug_getRawBlock", params: [blockNumber] }, options);
}
