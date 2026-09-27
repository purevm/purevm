import type { RequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

type EthGetBlockReceiptsByHash = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockHash],
  RpcTransactionReceipt[] | null
>;

export function ethGetBlockReceiptsByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockHash: BlockHash,
  requestOptions?: options,
): Promise<RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByHash>(
    { method: "eth_getBlockReceipts", params: [blockHash] },
    requestOptions,
  );
}
