import type { RequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

export type EthGetBlockReceiptsByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
};

type EthGetBlockReceiptsByHash = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockHash],
  readonly RpcTransactionReceipt[] | null
>;

export function ethGetBlockReceiptsByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBlockReceiptsByHashParameters,
  requestOptions?: options,
): Promise<readonly RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByHash>(
    { method: "eth_getBlockReceipts", params: [parameters.blockHash] },
    requestOptions,
  );
}
