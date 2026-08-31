import type { RequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock } from "./types.js";

export type EthGetBlockByTagParameters<full extends boolean = false> = {
  blockTag: BlockTag;
  includeTransactions?: full;
};

type EthGetBlockByTag<full extends boolean> = RpcMethodDefinition<
  "eth_getBlockByNumber",
  readonly [BlockTag, full],
  RpcBlock<full> | null
>;

export function ethGetBlockByTag<
  const full extends boolean = false,
  options extends RequestOptions = RequestOptions,
>(
  client: RpcRequester<options>,
  parameters: EthGetBlockByTagParameters<full>,
  requestOptions?: options,
): Promise<RpcBlock<full> | null> {
  const includeTransactions = parameters.includeTransactions ?? false;
  return client.request<EthGetBlockByTag<full>>(
    {
      method: "eth_getBlockByNumber",
      params: [parameters.blockTag, includeTransactions] as readonly [BlockTag, full],
    },
    requestOptions,
  );
}
