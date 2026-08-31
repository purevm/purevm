import type { RequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

type EthGetBlockReceiptsByTag = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockTag],
  RpcTransactionReceipt[] | null
>;

export function ethGetBlockReceiptsByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockTag: BlockTag,
  requestOptions?: options,
): Promise<RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByTag>(
    { method: "eth_getBlockReceipts", params: [blockTag] },
    requestOptions,
  );
}
