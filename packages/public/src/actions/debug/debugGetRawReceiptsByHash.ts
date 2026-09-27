import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"debug_getRawReceipts", readonly [BlockHash], Hex[]>;

/** Returns the EIP-2718 encoded receipts of the block. */
export function debugGetRawReceiptsByHash(
  client: RpcRequester<HttpRequestOptions>,
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<Hex[]> {
  return client.request<Method>({ method: "debug_getRawReceipts", params: [blockHash] }, options);
}
