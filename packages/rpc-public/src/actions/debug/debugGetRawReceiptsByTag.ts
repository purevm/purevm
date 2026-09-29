import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawReceiptsByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type Method = RpcMethodDefinition<"debug_getRawReceipts", readonly [BlockTag], readonly Hex[]>;

/** Returns the EIP-2718 encoded receipts of the block. */
export function debugGetRawReceiptsByTag(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawReceiptsByTagParameters,
  options?: HttpRequestOptions,
): Promise<readonly Hex[]> {
  return client.request<Method>(
    { method: "debug_getRawReceipts", params: [parameters.blockTag] },
    options,
  );
}
