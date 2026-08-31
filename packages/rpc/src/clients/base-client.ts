import type { RequestOptions } from "@purevm/transports";

import {
  ethBlockNumber,
  ethChainId,
  ethGetBalance,
  ethGetBlockByHash,
  ethGetBlockByNumber,
  ethGetBlockByTag,
  ethGetBlockReceiptsByHash,
  ethGetBlockReceiptsByNumber,
  ethGetBlockReceiptsByTag,
  ethGetCode,
  ethGetLogsByHash,
  ethGetLogsByRange,
  ethGetTransactionByHash,
  ethGetTransactionReceipt,
  netVersion,
  type EthGetBalanceParameters,
  type EthGetBlockByHashParameters,
  type EthGetBlockByNumberParameters,
  type EthGetBlockByTagParameters,
  type EthGetCodeParameters,
  type LogsByHashFilter,
  type LogsByRangeFilter,
  type RpcBlock,
  type RpcLog,
  type RpcTransaction,
  type RpcTransactionReceipt,
} from "../actions/index.js";
import type {
  BlockHash,
  BlockNumber,
  BlockTag,
  Hex,
  Quantity,
  TransactionHash,
} from "../types/primitives.js";
import type { RpcRequester } from "../types/rpc.js";

export class BaseClient<options extends RequestOptions> {
  protected readonly requester: RpcRequester<options>;

  constructor(requester: RpcRequester<options>) {
    this.requester = requester;
  }

  ethBlockNumber(options?: options): Promise<Quantity> {
    return ethBlockNumber(this.requester, options);
  }

  ethChainId(options?: options): Promise<Quantity> {
    return ethChainId(this.requester, options);
  }

  ethGetBalance(parameters: EthGetBalanceParameters, options?: options): Promise<Quantity> {
    return ethGetBalance(this.requester, parameters, options);
  }

  ethGetBlockByHash<const full extends boolean = false>(
    parameters: EthGetBlockByHashParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByHash(this.requester, parameters, options);
  }

  ethGetBlockByNumber<const full extends boolean = false>(
    parameters: EthGetBlockByNumberParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByNumber(this.requester, parameters, options);
  }

  ethGetBlockByTag<const full extends boolean = false>(
    parameters: EthGetBlockByTagParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByTag(this.requester, parameters, options);
  }

  ethGetBlockReceiptsByHash(
    blockHash: BlockHash,
    options?: options,
  ): Promise<RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByHash(this.requester, blockHash, options);
  }

  ethGetBlockReceiptsByNumber(
    blockNumber: BlockNumber,
    options?: options,
  ): Promise<RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByNumber(this.requester, blockNumber, options);
  }

  ethGetBlockReceiptsByTag(
    blockTag: BlockTag,
    options?: options,
  ): Promise<RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByTag(this.requester, blockTag, options);
  }

  ethGetCode(parameters: EthGetCodeParameters, options?: options): Promise<Hex> {
    return ethGetCode(this.requester, parameters, options);
  }

  ethGetLogsByHash(filter: LogsByHashFilter, options?: options): Promise<RpcLog[]> {
    return ethGetLogsByHash(this.requester, filter, options);
  }

  ethGetLogsByRange(filter: LogsByRangeFilter, options?: options): Promise<RpcLog[]> {
    return ethGetLogsByRange(this.requester, filter, options);
  }

  ethGetTransactionByHash(
    transactionHash: TransactionHash,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByHash(this.requester, transactionHash, options);
  }

  ethGetTransactionReceipt(
    transactionHash: TransactionHash,
    options?: options,
  ): Promise<RpcTransactionReceipt | null> {
    return ethGetTransactionReceipt(this.requester, transactionHash, options);
  }

  netVersion(options?: options): Promise<string> {
    return netVersion(this.requester, options);
  }
}
