import type { RequestOptions } from "@purevm/transports";

import {
  ethBlockNumber,
  ethChainId,
  ethGetBalance,
  ethGetBlockByHash,
  ethGetBlockByNumber,
  ethGetBlockReceiptsByHash,
  ethGetBlockReceiptsByNumber,
  ethGetCode,
  ethGetLogsByHash,
  ethGetLogsByRange,
  ethGetTransactionByHash,
  ethGetTransactionReceipt,
  netVersion,
  type AccountAtBlockParameters,
  type GetBlockByHashParameters,
  type GetBlockByNumberParameters,
} from "../actions/index.js";
import type {
  LogsByHashFilter,
  LogsByRangeFilter,
  RpcBlock,
  RpcLog,
  RpcTransaction,
  RpcTransactionReceipt,
} from "../types/eth.js";
import type {
  BlockHash,
  BlockNumberOrTag,
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

  ethGetBalance(parameters: AccountAtBlockParameters, options?: options): Promise<Quantity> {
    return ethGetBalance(this.requester, parameters, options);
  }

  ethGetBlockByHash<const full extends boolean = false>(
    parameters: GetBlockByHashParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByHash(this.requester, parameters, options);
  }

  ethGetBlockByNumber<const full extends boolean = false>(
    parameters: GetBlockByNumberParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByNumber(this.requester, parameters, options);
  }

  ethGetBlockReceiptsByHash(
    blockHash: BlockHash,
    options?: options,
  ): Promise<RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByHash(this.requester, blockHash, options);
  }

  ethGetBlockReceiptsByNumber(
    blockNumber: BlockNumberOrTag,
    options?: options,
  ): Promise<RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByNumber(this.requester, blockNumber, options);
  }

  ethGetCode(parameters: AccountAtBlockParameters, options?: options): Promise<Hex> {
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
