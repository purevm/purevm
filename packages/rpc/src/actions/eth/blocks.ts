import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, BlockNumberOrTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcBlock, RpcTransactionReceipt } from "./types.js";

type EthBlockNumber = RpcMethodDefinition<"eth_blockNumber", undefined, Quantity>;
type EthGetBlockByHash<full extends boolean> = RpcMethodDefinition<
  "eth_getBlockByHash",
  readonly [BlockHash, full],
  RpcBlock<full> | null
>;
type EthGetBlockByNumber<full extends boolean> = RpcMethodDefinition<
  "eth_getBlockByNumber",
  readonly [BlockNumberOrTag, full],
  RpcBlock<full> | null
>;
type EthGetBlockReceiptsByHash = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockHash],
  RpcTransactionReceipt[] | null
>;
type EthGetBlockReceiptsByNumber = RpcMethodDefinition<
  "eth_getBlockReceipts",
  readonly [BlockNumberOrTag],
  RpcTransactionReceipt[] | null
>;

export type GetBlockByHashParameters<full extends boolean = false> = {
  blockHash: BlockHash;
  includeTransactions?: full;
};

export type GetBlockByNumberParameters<full extends boolean = false> = {
  blockNumber: BlockNumberOrTag;
  includeTransactions?: full;
};

export function ethBlockNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthBlockNumber>({ method: "eth_blockNumber" }, requestOptions);
}

export function ethGetBlockByHash<
  const full extends boolean = false,
  options extends RequestOptions = RequestOptions,
>(
  client: RpcRequester<options>,
  parameters: GetBlockByHashParameters<full>,
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

export function ethGetBlockByNumber<
  const full extends boolean = false,
  options extends RequestOptions = RequestOptions,
>(
  client: RpcRequester<options>,
  parameters: GetBlockByNumberParameters<full>,
  requestOptions?: options,
): Promise<RpcBlock<full> | null> {
  const includeTransactions = parameters.includeTransactions ?? false;
  return client.request<EthGetBlockByNumber<full>>(
    {
      method: "eth_getBlockByNumber",
      params: [parameters.blockNumber, includeTransactions] as readonly [BlockNumberOrTag, full],
    },
    requestOptions,
  );
}

export function ethGetBlockReceiptsByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockHash: BlockHash,
  requestOptions?: options,
): Promise<RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByHash>(
    { method: "eth_getBlockReceipts", params: [blockHash] },
    requestOptions,
  );
}

export function ethGetBlockReceiptsByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockNumber: BlockNumberOrTag,
  requestOptions?: options,
): Promise<RpcTransactionReceipt[] | null> {
  return client.request<EthGetBlockReceiptsByNumber>(
    { method: "eth_getBlockReceipts", params: [blockNumber] },
    requestOptions,
  );
}
