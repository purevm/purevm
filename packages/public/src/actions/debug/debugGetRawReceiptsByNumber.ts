import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"debug_getRawReceipts", readonly [BlockNumber], Hex[]>;

/** Returns the EIP-2718 encoded receipts of the block. */
export function debugGetRawReceiptsByNumber(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<Hex[]> {
  return client.request<Method>({ method: "debug_getRawReceipts", params: [blockNumber] }, options);
}
