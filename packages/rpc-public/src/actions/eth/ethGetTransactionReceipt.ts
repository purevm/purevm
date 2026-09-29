import type { RequestOptions } from "@purevm/rpc-transport";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransactionReceipt } from "./types.js";

export type EthGetTransactionReceiptParameters = {
  /** Hash of the target transaction. */
  transactionHash: TransactionHash;
};

type EthGetTransactionReceipt = RpcMethodDefinition<
  "eth_getTransactionReceipt",
  readonly [TransactionHash],
  RpcTransactionReceipt | null
>;

export function ethGetTransactionReceipt<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionReceiptParameters,
  requestOptions?: options,
): Promise<RpcTransactionReceipt | null> {
  return client.request<EthGetTransactionReceipt>(
    { method: "eth_getTransactionReceipt", params: [parameters.transactionHash] },
    requestOptions,
  );
}
