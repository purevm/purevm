import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawReceiptsByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
};

type Method = RpcMethodDefinition<"debug_getRawReceipts", readonly [BlockHash], readonly Hex[]>;

/** Returns the EIP-2718 encoded receipts of the block. */
export function debugGetRawReceiptsByHash(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawReceiptsByHashParameters,
  options?: HttpRequestOptions,
): Promise<readonly Hex[]> {
  return client.request<Method>(
    { method: "debug_getRawReceipts", params: [parameters.blockHash] },
    options,
  );
}
