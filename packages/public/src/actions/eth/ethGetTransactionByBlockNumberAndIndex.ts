import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Index } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcTransaction } from "./types.js";

export type EthGetTransactionByBlockNumberAndIndexParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
  /** Hex-encoded position within the block. */
  index: Index;
};

type Method = RpcMethodDefinition<
  "eth_getTransactionByBlockNumberAndIndex",
  readonly [BlockNumber, Index],
  RpcTransaction | null
>;
export function ethGetTransactionByBlockNumberAndIndex<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionByBlockNumberAndIndexParameters,
  requestOptions?: options,
): Promise<RpcTransaction | null> {
  return client.request<Method>(
    {
      method: "eth_getTransactionByBlockNumberAndIndex",
      params: [parameters.blockNumber, parameters.index],
    },
    requestOptions,
  );
}
