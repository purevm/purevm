import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

export type EthGetBlockReceiptsByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
};

type EthGetBlockReceiptsByTag = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockTag],
  readonly RpcTransactionReceipt[] | null
>;

export function ethGetBlockReceiptsByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBlockReceiptsByTagParameters,
  requestOptions?: options,
): Promise<readonly RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByTag>(
    { method: "eth_getBlockReceipts", params: [parameters.blockTag] },
    requestOptions,
  );
}
