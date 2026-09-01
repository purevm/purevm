import type { RequestOptions } from "@purevm/transports";

import {
  ethBlobBaseFee,
  ethBlockNumber,
  ethCall,
  ethChainId,
  ethCreateAccessList,
  ethEstimateGas,
  ethFeeHistory,
  ethGasPrice,
  ethGetBalance,
  ethGetBlockByHash,
  ethGetBlockByNumber,
  ethGetBlockByTag,
  ethGetBlockTransactionCountByHash,
  ethGetBlockTransactionCountByNumber,
  ethGetBlockTransactionCountByTag,
  ethGetBlockReceiptsByHash,
  ethGetBlockReceiptsByNumber,
  ethGetBlockReceiptsByTag,
  ethGetCode,
  ethGetFilterChanges,
  ethGetFilterLogs,
  ethGetLogsByHash,
  ethGetLogsByRange,
  ethGetProof,
  ethGetStorageAt,
  ethGetTransactionByBlockHashAndIndex,
  ethGetTransactionByBlockNumberAndIndex,
  ethGetTransactionByBlockTagAndIndex,
  ethGetTransactionByHash,
  ethGetTransactionCount,
  ethGetTransactionReceipt,
  ethGetUncleByBlockHashAndIndex,
  ethGetUncleByBlockNumberAndIndex,
  ethGetUncleByBlockTagAndIndex,
  ethGetUncleCountByBlockHash,
  ethGetUncleCountByBlockNumber,
  ethGetUncleCountByBlockTag,
  ethMaxPriorityFeePerGas,
  ethNewBlockFilter,
  ethNewFilter,
  ethNewPendingTransactionFilter,
  ethSyncing,
  ethUninstallFilter,
  netListening,
  netPeerCount,
  netVersion,
  type EthCallParameters,
  type EthCreateAccessListParameters,
  type EthEstimateGasParameters,
  type EthFeeHistoryParameters,
  type EthGetBalanceParameters,
  type EthGetBlockByHashParameters,
  type EthGetBlockByNumberParameters,
  type EthGetBlockByTagParameters,
  type EthGetCodeParameters,
  type EthGetProofParameters,
  type EthGetStorageAtParameters,
  type EthGetTransactionCountParameters,
  type LogsByHashFilter,
  type LogsByRangeFilter,
  type RpcBlock,
  type RpcAccessListResult,
  type RpcAccountProof,
  type RpcFeeHistory,
  type RpcLog,
  type RpcSyncingStatus,
  type RpcTransaction,
  type RpcTransactionReceipt,
} from "../actions/index.js";
import type {
  BlockHash,
  BlockNumber,
  BlockTag,
  Hash,
  Hex,
  Index,
  Quantity,
  TransactionHash,
} from "../types/primitives.js";
import type { RpcRequester } from "../types/rpc.js";

export class BaseClient<options extends RequestOptions> {
  protected readonly requester: RpcRequester<options>;

  constructor(requester: RpcRequester<options>) {
    this.requester = requester;
  }

  ethBlobBaseFee(options?: options): Promise<Quantity> {
    return ethBlobBaseFee(this.requester, options);
  }

  ethBlockNumber(options?: options): Promise<Quantity> {
    return ethBlockNumber(this.requester, options);
  }

  ethChainId(options?: options): Promise<Quantity> {
    return ethChainId(this.requester, options);
  }

  ethCall(parameters: EthCallParameters, options?: options): Promise<Hex> {
    return ethCall(this.requester, parameters, options);
  }

  ethCreateAccessList(
    parameters: EthCreateAccessListParameters,
    options?: options,
  ): Promise<RpcAccessListResult> {
    return ethCreateAccessList(this.requester, parameters, options);
  }

  ethEstimateGas(parameters: EthEstimateGasParameters, options?: options): Promise<Quantity> {
    return ethEstimateGas(this.requester, parameters, options);
  }

  ethFeeHistory(parameters: EthFeeHistoryParameters, options?: options): Promise<RpcFeeHistory> {
    return ethFeeHistory(this.requester, parameters, options);
  }

  ethGasPrice(options?: options): Promise<Quantity> {
    return ethGasPrice(this.requester, options);
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

  ethGetBlockTransactionCountByHash(blockHash: BlockHash, options?: options): Promise<Quantity> {
    return ethGetBlockTransactionCountByHash(this.requester, blockHash, options);
  }

  ethGetBlockTransactionCountByNumber(
    blockNumber: BlockNumber,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBlockTransactionCountByNumber(this.requester, blockNumber, options);
  }

  ethGetBlockTransactionCountByTag(blockTag: BlockTag, options?: options): Promise<Quantity> {
    return ethGetBlockTransactionCountByTag(this.requester, blockTag, options);
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

  ethGetFilterChanges<result extends Hash | RpcLog = RpcLog>(
    filterId: Quantity,
    options?: options,
  ): Promise<result[]> {
    return ethGetFilterChanges<result, options>(this.requester, filterId, options);
  }

  ethGetFilterLogs(filterId: Quantity, options?: options): Promise<RpcLog[]> {
    return ethGetFilterLogs(this.requester, filterId, options);
  }

  ethGetLogsByHash(filter: LogsByHashFilter, options?: options): Promise<RpcLog[]> {
    return ethGetLogsByHash(this.requester, filter, options);
  }

  ethGetLogsByRange(filter: LogsByRangeFilter, options?: options): Promise<RpcLog[]> {
    return ethGetLogsByRange(this.requester, filter, options);
  }

  ethGetProof(parameters: EthGetProofParameters, options?: options): Promise<RpcAccountProof> {
    return ethGetProof(this.requester, parameters, options);
  }

  ethGetStorageAt(parameters: EthGetStorageAtParameters, options?: options): Promise<Hex> {
    return ethGetStorageAt(this.requester, parameters, options);
  }

  ethGetTransactionByBlockHashAndIndex(
    blockHash: BlockHash,
    index: Index,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByBlockHashAndIndex(this.requester, blockHash, index, options);
  }

  ethGetTransactionByBlockNumberAndIndex(
    blockNumber: BlockNumber,
    index: Index,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByBlockNumberAndIndex(this.requester, blockNumber, index, options);
  }

  ethGetTransactionByBlockTagAndIndex(
    blockTag: BlockTag,
    index: Index,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByBlockTagAndIndex(this.requester, blockTag, index, options);
  }

  ethGetTransactionByHash(
    transactionHash: TransactionHash,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByHash(this.requester, transactionHash, options);
  }

  ethGetTransactionCount(
    parameters: EthGetTransactionCountParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetTransactionCount(this.requester, parameters, options);
  }

  ethGetTransactionReceipt(
    transactionHash: TransactionHash,
    options?: options,
  ): Promise<RpcTransactionReceipt | null> {
    return ethGetTransactionReceipt(this.requester, transactionHash, options);
  }

  ethGetUncleByBlockHashAndIndex(
    blockHash: BlockHash,
    index: Index,
    options?: options,
  ): Promise<RpcBlock<false> | null> {
    return ethGetUncleByBlockHashAndIndex(this.requester, blockHash, index, options);
  }

  ethGetUncleByBlockNumberAndIndex(
    blockNumber: BlockNumber,
    index: Index,
    options?: options,
  ): Promise<RpcBlock<false> | null> {
    return ethGetUncleByBlockNumberAndIndex(this.requester, blockNumber, index, options);
  }

  ethGetUncleByBlockTagAndIndex(
    blockTag: BlockTag,
    index: Index,
    options?: options,
  ): Promise<RpcBlock<false> | null> {
    return ethGetUncleByBlockTagAndIndex(this.requester, blockTag, index, options);
  }

  ethGetUncleCountByBlockHash(blockHash: BlockHash, options?: options): Promise<Quantity> {
    return ethGetUncleCountByBlockHash(this.requester, blockHash, options);
  }

  ethGetUncleCountByBlockNumber(blockNumber: BlockNumber, options?: options): Promise<Quantity> {
    return ethGetUncleCountByBlockNumber(this.requester, blockNumber, options);
  }

  ethGetUncleCountByBlockTag(blockTag: BlockTag, options?: options): Promise<Quantity> {
    return ethGetUncleCountByBlockTag(this.requester, blockTag, options);
  }

  ethMaxPriorityFeePerGas(options?: options): Promise<Quantity> {
    return ethMaxPriorityFeePerGas(this.requester, options);
  }

  ethNewBlockFilter(options?: options): Promise<Quantity> {
    return ethNewBlockFilter(this.requester, options);
  }

  ethNewFilter(filter: LogsByRangeFilter, options?: options): Promise<Quantity> {
    return ethNewFilter(this.requester, filter, options);
  }

  ethNewPendingTransactionFilter(options?: options): Promise<Quantity> {
    return ethNewPendingTransactionFilter(this.requester, options);
  }

  ethSyncing(options?: options): Promise<false | RpcSyncingStatus> {
    return ethSyncing(this.requester, options);
  }

  ethUninstallFilter(filterId: Quantity, options?: options): Promise<boolean> {
    return ethUninstallFilter(this.requester, filterId, options);
  }

  netListening(options?: options): Promise<boolean> {
    return netListening(this.requester, options);
  }

  netPeerCount(options?: options): Promise<Quantity> {
    return netPeerCount(this.requester, options);
  }

  netVersion(options?: options): Promise<string> {
    return netVersion(this.requester, options);
  }
}
