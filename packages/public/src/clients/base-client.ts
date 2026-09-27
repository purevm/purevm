import type { RequestOptions } from "@purevm/transports";

import {
  ethBlobBaseFee,
  ethBlockNumber,
  ethCallByHash,
  ethCallByNumber,
  ethCallByTag,
  ethChainId,
  ethCreateAccessListByNumber,
  ethCreateAccessListByTag,
  ethEstimateGasByNumber,
  ethEstimateGasByTag,
  ethFeeHistoryByNumber,
  ethFeeHistoryByTag,
  ethGasPrice,
  ethGetBalanceByHash,
  ethGetBalanceByNumber,
  ethGetBalanceByTag,
  ethGetBlockByHash,
  ethGetBlockByNumber,
  ethGetBlockByTag,
  ethGetBlockReceiptsByHash,
  ethGetBlockReceiptsByNumber,
  ethGetBlockReceiptsByTag,
  ethGetBlockTransactionCountByHash,
  ethGetBlockTransactionCountByNumber,
  ethGetBlockTransactionCountByTag,
  ethGetCodeByHash,
  ethGetCodeByNumber,
  ethGetCodeByTag,
  ethGetFilterChanges,
  ethGetFilterLogs,
  ethGetLogsByHash,
  ethGetLogsByRange,
  ethGetProofByHash,
  ethGetProofByNumber,
  ethGetProofByTag,
  ethGetStorageAtByHash,
  ethGetStorageAtByNumber,
  ethGetStorageAtByTag,
  ethGetTransactionByBlockHashAndIndex,
  ethGetTransactionByBlockNumberAndIndex,
  ethGetTransactionByBlockTagAndIndex,
  ethGetTransactionByHash,
  ethGetTransactionCountByHash,
  ethGetTransactionCountByNumber,
  ethGetTransactionCountByTag,
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
  ethSimulateV1ByHash,
  ethSimulateV1ByNumber,
  ethSimulateV1ByTag,
  ethSyncing,
  ethUninstallFilter,
  netListening,
  netPeerCount,
  netVersion,
  web3ClientVersion,
  web3Sha3,
  type EthCallByHashParameters,
  type EthCallByNumberParameters,
  type EthCallByTagParameters,
  type EthCreateAccessListByNumberParameters,
  type EthCreateAccessListByTagParameters,
  type EthEstimateGasByNumberParameters,
  type EthEstimateGasByTagParameters,
  type EthFeeHistoryByNumberParameters,
  type EthFeeHistoryByTagParameters,
  type EthGetBalanceByHashParameters,
  type EthGetBalanceByNumberParameters,
  type EthGetBalanceByTagParameters,
  type EthGetBlockByHashParameters,
  type EthGetBlockByNumberParameters,
  type EthGetBlockByTagParameters,
  type EthGetCodeByHashParameters,
  type EthGetCodeByNumberParameters,
  type EthGetCodeByTagParameters,
  type EthGetProofByHashParameters,
  type EthGetProofByNumberParameters,
  type EthGetProofByTagParameters,
  type EthGetStorageAtByHashParameters,
  type EthGetStorageAtByNumberParameters,
  type EthGetStorageAtByTagParameters,
  type EthGetTransactionCountByHashParameters,
  type EthGetTransactionCountByNumberParameters,
  type EthGetTransactionCountByTagParameters,
  type EthSimulateV1ByHashParameters,
  type EthSimulateV1ByNumberParameters,
  type EthSimulateV1ByTagParameters,
  type LogsByHashFilter,
  type LogsByRangeFilter,
  type RpcAccessListResult,
  type RpcAccountProof,
  type RpcBlock,
  type RpcFeeHistory,
  type RpcLog,
  type RpcSimulatedBlock,
  type RpcSyncingStatus,
  type RpcTransaction,
  type RpcTransactionReceipt,
  txpoolContent,
  txpoolContentFrom,
  txpoolInspect,
  txpoolStatus,
  type TxpoolContent,
  type TxpoolContentFrom,
  type TxpoolInspect,
  type TxpoolStatus,
} from "../actions/index.js";
import type {
  Address,
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

  ethCallByHash(parameters: EthCallByHashParameters, options?: options): Promise<Hex> {
    return ethCallByHash(this.requester, parameters, options);
  }

  ethCallByNumber(parameters: EthCallByNumberParameters, options?: options): Promise<Hex> {
    return ethCallByNumber(this.requester, parameters, options);
  }

  ethCallByTag(parameters: EthCallByTagParameters, options?: options): Promise<Hex> {
    return ethCallByTag(this.requester, parameters, options);
  }

  ethChainId(options?: options): Promise<Quantity> {
    return ethChainId(this.requester, options);
  }

  ethCreateAccessListByNumber(
    parameters: EthCreateAccessListByNumberParameters,
    options?: options,
  ): Promise<RpcAccessListResult> {
    return ethCreateAccessListByNumber(this.requester, parameters, options);
  }

  ethCreateAccessListByTag(
    parameters: EthCreateAccessListByTagParameters,
    options?: options,
  ): Promise<RpcAccessListResult> {
    return ethCreateAccessListByTag(this.requester, parameters, options);
  }

  ethEstimateGasByNumber(
    parameters: EthEstimateGasByNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethEstimateGasByNumber(this.requester, parameters, options);
  }

  ethEstimateGasByTag(
    parameters: EthEstimateGasByTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethEstimateGasByTag(this.requester, parameters, options);
  }

  ethFeeHistoryByNumber(
    parameters: EthFeeHistoryByNumberParameters,
    options?: options,
  ): Promise<RpcFeeHistory> {
    return ethFeeHistoryByNumber(this.requester, parameters, options);
  }

  ethFeeHistoryByTag(
    parameters: EthFeeHistoryByTagParameters,
    options?: options,
  ): Promise<RpcFeeHistory> {
    return ethFeeHistoryByTag(this.requester, parameters, options);
  }

  ethGasPrice(options?: options): Promise<Quantity> {
    return ethGasPrice(this.requester, options);
  }

  ethGetBalanceByHash(
    parameters: EthGetBalanceByHashParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBalanceByHash(this.requester, parameters, options);
  }

  ethGetBalanceByNumber(
    parameters: EthGetBalanceByNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBalanceByNumber(this.requester, parameters, options);
  }

  ethGetBalanceByTag(
    parameters: EthGetBalanceByTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBalanceByTag(this.requester, parameters, options);
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

  ethGetCodeByHash(parameters: EthGetCodeByHashParameters, options?: options): Promise<Hex> {
    return ethGetCodeByHash(this.requester, parameters, options);
  }

  ethGetCodeByNumber(parameters: EthGetCodeByNumberParameters, options?: options): Promise<Hex> {
    return ethGetCodeByNumber(this.requester, parameters, options);
  }

  ethGetCodeByTag(parameters: EthGetCodeByTagParameters, options?: options): Promise<Hex> {
    return ethGetCodeByTag(this.requester, parameters, options);
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

  ethGetProofByHash(
    parameters: EthGetProofByHashParameters,
    options?: options,
  ): Promise<RpcAccountProof> {
    return ethGetProofByHash(this.requester, parameters, options);
  }

  ethGetProofByNumber(
    parameters: EthGetProofByNumberParameters,
    options?: options,
  ): Promise<RpcAccountProof> {
    return ethGetProofByNumber(this.requester, parameters, options);
  }

  ethGetProofByTag(
    parameters: EthGetProofByTagParameters,
    options?: options,
  ): Promise<RpcAccountProof> {
    return ethGetProofByTag(this.requester, parameters, options);
  }

  ethGetStorageAtByHash(
    parameters: EthGetStorageAtByHashParameters,
    options?: options,
  ): Promise<Hex> {
    return ethGetStorageAtByHash(this.requester, parameters, options);
  }

  ethGetStorageAtByNumber(
    parameters: EthGetStorageAtByNumberParameters,
    options?: options,
  ): Promise<Hex> {
    return ethGetStorageAtByNumber(this.requester, parameters, options);
  }

  ethGetStorageAtByTag(
    parameters: EthGetStorageAtByTagParameters,
    options?: options,
  ): Promise<Hex> {
    return ethGetStorageAtByTag(this.requester, parameters, options);
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

  ethGetTransactionCountByHash(
    parameters: EthGetTransactionCountByHashParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetTransactionCountByHash(this.requester, parameters, options);
  }

  ethGetTransactionCountByNumber(
    parameters: EthGetTransactionCountByNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetTransactionCountByNumber(this.requester, parameters, options);
  }

  ethGetTransactionCountByTag(
    parameters: EthGetTransactionCountByTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetTransactionCountByTag(this.requester, parameters, options);
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

  ethSimulateV1ByHash(
    parameters: EthSimulateV1ByHashParameters,
    options?: options,
  ): Promise<RpcSimulatedBlock[]> {
    return ethSimulateV1ByHash(this.requester, parameters, options);
  }

  ethSimulateV1ByNumber(
    parameters: EthSimulateV1ByNumberParameters,
    options?: options,
  ): Promise<RpcSimulatedBlock[]> {
    return ethSimulateV1ByNumber(this.requester, parameters, options);
  }

  ethSimulateV1ByTag(
    parameters: EthSimulateV1ByTagParameters,
    options?: options,
  ): Promise<RpcSimulatedBlock[]> {
    return ethSimulateV1ByTag(this.requester, parameters, options);
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

  txpoolContent(options?: options): Promise<TxpoolContent> {
    return txpoolContent(this.requester, options);
  }

  txpoolContentFrom(address: Address, options?: options): Promise<TxpoolContentFrom> {
    return txpoolContentFrom(this.requester, address, options);
  }

  txpoolInspect(options?: options): Promise<TxpoolInspect> {
    return txpoolInspect(this.requester, options);
  }

  txpoolStatus(options?: options): Promise<TxpoolStatus> {
    return txpoolStatus(this.requester, options);
  }

  web3ClientVersion(options?: options): Promise<string> {
    return web3ClientVersion(this.requester, options);
  }

  web3Sha3(data: Hex, options?: options): Promise<Hash> {
    return web3Sha3(this.requester, data, options);
  }
}
