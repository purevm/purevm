import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

export type DebugGetRawReceiptsByNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
};

type Method = RpcMethodDefinition<"debug_getRawReceipts", readonly [BlockNumber], readonly Hex[]>;

/** Returns the EIP-2718 encoded receipts of the block. */
export function debugGetRawReceiptsByNumber(
  client: RpcRequester<HttpRequestOptions>,
  parameters: DebugGetRawReceiptsByNumberParameters,
  options?: HttpRequestOptions,
): Promise<readonly Hex[]> {
  return client.request<Method>(
    { method: "debug_getRawReceipts", params: [parameters.blockNumber] },
    options,
  );
}
