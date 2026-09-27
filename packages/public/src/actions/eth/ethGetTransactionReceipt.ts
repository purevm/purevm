import type { RequestOptions } from "@purevm/transports";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

type EthGetTransactionReceipt = RpcMethodDefinition<
  "eth_getTransactionReceipt",
  readonly [TransactionHash],
  RpcTransactionReceipt | null
>;

export function ethGetTransactionReceipt<options extends RequestOptions>(
  client: RpcRequester<options>,
  transactionHash: TransactionHash,
  requestOptions?: options,
): Promise<RpcTransactionReceipt | null> {
  return client.request<EthGetTransactionReceipt>(
    { method: "eth_getTransactionReceipt", params: [transactionHash] },
    requestOptions,
  );
}
