import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

export type EthGetBlockReceiptsByNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
};

type EthGetBlockReceiptsByNumber = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockNumber],
  readonly RpcTransactionReceipt[] | null
>;

export function ethGetBlockReceiptsByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBlockReceiptsByNumberParameters,
  requestOptions?: options,
): Promise<readonly RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByNumber>(
    { method: "eth_getBlockReceipts", params: [parameters.blockNumber] },
    requestOptions,
  );
}
