import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

type EthGetBlockReceiptsByNumber = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockNumber],
  RpcTransactionReceipt[] | null
>;

export function ethGetBlockReceiptsByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockNumber: BlockNumber,
  requestOptions?: options,
): Promise<RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByNumber>(
    { method: "eth_getBlockReceipts", params: [blockNumber] },
    requestOptions,
  );
}
