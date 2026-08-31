import type { RequestOptions } from "@purevm/transports";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

type EthGetTransactionByHash = RpcMethodDefinition<
  "eth_getTransactionByHash",
  readonly [TransactionHash],
  RpcTransaction | null
>;

export function ethGetTransactionByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  transactionHash: TransactionHash,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<EthGetTransactionByHash>(
    { method: "eth_getTransactionByHash", params: [transactionHash] },
    requestOptions,
  );
}
