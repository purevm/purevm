import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

export type EthGetBlockByNumberParameters<full extends boolean = false> = {
  /** Hex-encoded number of the block to retrieve. */
  blockNumber: BlockNumber;
  /** Return full transactions when true, otherwise transaction hashes. */
  includeTransactions?: full;
};

type EthGetBlockByNumber<full extends boolean> = RpcMethodDefinition<
  "eth_getBlockByNumber",
  readonly [BlockNumber, full],
  RpcBlock<full> | null
>;

export function ethGetBlockByNumber<
  const full extends boolean = false,
  options extends RequestOptions = RequestOptions,
>(
  client: RpcRequester<options>,
  parameters: EthGetBlockByNumberParameters<full>,
  requestOptions?: options,
): Promise<RpcBlock<full> | null> {
  const includeTransactions = parameters.includeTransactions ?? false;
  return client.request<EthGetBlockByNumber<full>>(
    {
      method: "eth_getBlockByNumber",
      params: [parameters.blockNumber, includeTransactions] as readonly [BlockNumber, full],
    },
    requestOptions,
  );
}
