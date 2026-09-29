import type { RequestOptions } from "@purevm/rpc-transport";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

export type EthGetTransactionByHashParameters = {
  /** Hash of the target transaction. */
  transactionHash: TransactionHash;
};

type EthGetTransactionByHash = RpcMethodDefinition<
  "eth_getTransactionByHash",
  readonly [TransactionHash],
  RpcTransaction | null
>;

export function ethGetTransactionByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionByHashParameters,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<EthGetTransactionByHash>(
    { method: "eth_getTransactionByHash", params: [parameters.transactionHash] },
    requestOptions,
  );
}
