import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"debug_getRawReceipts", readonly [BlockTag], Hex[]>;

/** Returns the EIP-2718 encoded receipts of the block. */
export function debugGetRawReceiptsByTag(
  client: RpcRequester<HttpRequestOptions>,
  blockTag: BlockTag,
  options?: HttpRequestOptions,
): Promise<Hex[]> {
  return client.request<Method>({ method: "debug_getRawReceipts", params: [blockTag] }, options);
}
