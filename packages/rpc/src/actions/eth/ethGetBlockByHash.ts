import type { RequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

export type EthGetBlockByHashParameters<full extends boolean = false> = {
  blockHash: BlockHash;
  includeTransactions?: full;
};

type EthGetBlockByHash<full extends boolean> = RpcMethodDefinition<
  "eth_getBlockByHash",
  readonly [BlockHash, full],
  RpcBlock<full> | null
>;

export function ethGetBlockByHash<
  const full extends boolean = false,
  options extends RequestOptions = RequestOptions,
>(
  client: RpcRequester<options>,
  parameters: EthGetBlockByHashParameters<full>,
  requestOptions?: options,
): Promise<RpcBlock<full> | null> {
  const includeTransactions = parameters.includeTransactions ?? false;
  return client.request<EthGetBlockByHash<full>>(
    {
      method: "eth_getBlockByHash",
      params: [parameters.blockHash, includeTransactions] as readonly [BlockHash, full],
    },
    requestOptions,
  );
}
