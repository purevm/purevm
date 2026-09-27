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
  txpoolContent,
  txpoolContentFrom,
  txpoolInspect,
  txpoolStatus,
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
  type EthGetBlockReceiptsByHashParameters,
  type EthGetBlockReceiptsByNumberParameters,
  type EthGetBlockReceiptsByTagParameters,
  type EthGetBlockTransactionCountByHashParameters,
  type EthGetBlockTransactionCountByNumberParameters,
  type EthGetBlockTransactionCountByTagParameters,
  type EthGetCodeByHashParameters,
  type EthGetCodeByNumberParameters,
  type EthGetCodeByTagParameters,
  type EthGetFilterChangesParameters,
  type EthGetFilterLogsParameters,
  type EthGetProofByHashParameters,
  type EthGetProofByNumberParameters,
  type EthGetProofByTagParameters,
  type EthGetStorageAtByHashParameters,
  type EthGetStorageAtByNumberParameters,
  type EthGetStorageAtByTagParameters,
  type EthGetTransactionByBlockHashAndIndexParameters,
  type EthGetTransactionByBlockNumberAndIndexParameters,
  type EthGetTransactionByBlockTagAndIndexParameters,
  type EthGetTransactionByHashParameters,
  type EthGetTransactionCountByHashParameters,
  type EthGetTransactionCountByNumberParameters,
  type EthGetTransactionCountByTagParameters,
  type EthGetTransactionReceiptParameters,
  type EthGetUncleByBlockHashAndIndexParameters,
  type EthGetUncleByBlockNumberAndIndexParameters,
  type EthGetUncleByBlockTagAndIndexParameters,
  type EthGetUncleCountByBlockHashParameters,
  type EthGetUncleCountByBlockNumberParameters,
  type EthGetUncleCountByBlockTagParameters,
  type EthSimulateV1ByHashParameters,
  type EthSimulateV1ByNumberParameters,
  type EthSimulateV1ByTagParameters,
  type EthUninstallFilterParameters,
  type FilterChange,
  type LogsByHashFilter,
  type LogsByRangeFilter,
  type NetworkId,
  type RpcAccessListResult,
  type RpcAccountProof,
  type RpcBlock,
  type RpcFeeHistory,
  type RpcLog,
  type RpcSimulatedBlock,
  type RpcSyncingStatus,
  type RpcTransaction,
  type RpcTransactionReceipt,
  type TxpoolContent,
  type TxpoolContentFrom,
  type TxpoolContentFromParameters,
  type TxpoolInspect,
  type TxpoolStatus,
  type Web3Sha3Parameters,
} from "../actions/index.js";
import type { Hash, Hex, Quantity } from "../types/primitives.js";
import type { RpcRequester } from "../types/rpc.js";

export class BaseClient<options extends RequestOptions> {
  protected readonly requester: RpcRequester<options>;

  constructor(requester: RpcRequester<options>) {
    this.requester = requester;
  }

  ethBlobBaseFee(options?: options): Promise<Quantity> {
    return ethBlobBaseFee<options>(this.requester, options);
  }

  ethBlockNumber(options?: options): Promise<Quantity> {
    return ethBlockNumber<options>(this.requester, options);
  }

  ethCallByHash(parameters: EthCallByHashParameters, options?: options): Promise<Hex> {
    return ethCallByHash<options>(this.requester, parameters, options);
  }

  ethCallByNumber(parameters: EthCallByNumberParameters, options?: options): Promise<Hex> {
    return ethCallByNumber<options>(this.requester, parameters, options);
  }

  ethCallByTag(parameters: EthCallByTagParameters, options?: options): Promise<Hex> {
    return ethCallByTag<options>(this.requester, parameters, options);
  }

  ethChainId(options?: options): Promise<Quantity> {
    return ethChainId<options>(this.requester, options);
  }

  ethCreateAccessListByNumber(
    parameters: EthCreateAccessListByNumberParameters,
    options?: options,
  ): Promise<RpcAccessListResult> {
    return ethCreateAccessListByNumber<options>(this.requester, parameters, options);
  }

  ethCreateAccessListByTag(
    parameters: EthCreateAccessListByTagParameters,
    options?: options,
  ): Promise<RpcAccessListResult> {
    return ethCreateAccessListByTag<options>(this.requester, parameters, options);
  }

  ethEstimateGasByNumber(
    parameters: EthEstimateGasByNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethEstimateGasByNumber<options>(this.requester, parameters, options);
  }

  ethEstimateGasByTag(
    parameters: EthEstimateGasByTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethEstimateGasByTag<options>(this.requester, parameters, options);
  }

  ethFeeHistoryByNumber(
    parameters: EthFeeHistoryByNumberParameters,
    options?: options,
  ): Promise<RpcFeeHistory> {
    return ethFeeHistoryByNumber<options>(this.requester, parameters, options);
  }

  ethFeeHistoryByTag(
    parameters: EthFeeHistoryByTagParameters,
    options?: options,
  ): Promise<RpcFeeHistory> {
    return ethFeeHistoryByTag<options>(this.requester, parameters, options);
  }

  ethGasPrice(options?: options): Promise<Quantity> {
    return ethGasPrice<options>(this.requester, options);
  }

  ethGetBalanceByHash(
    parameters: EthGetBalanceByHashParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBalanceByHash<options>(this.requester, parameters, options);
  }

  ethGetBalanceByNumber(
    parameters: EthGetBalanceByNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBalanceByNumber<options>(this.requester, parameters, options);
  }

  ethGetBalanceByTag(
    parameters: EthGetBalanceByTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBalanceByTag<options>(this.requester, parameters, options);
  }

  ethGetBlockByHash<const full extends boolean = false>(
    parameters: EthGetBlockByHashParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByHash<full, options>(this.requester, parameters, options);
  }

  ethGetBlockByNumber<const full extends boolean = false>(
    parameters: EthGetBlockByNumberParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByNumber<full, options>(this.requester, parameters, options);
  }

  ethGetBlockByTag<const full extends boolean = false>(
    parameters: EthGetBlockByTagParameters<full>,
    options?: options,
  ): Promise<RpcBlock<full> | null> {
    return ethGetBlockByTag<full, options>(this.requester, parameters, options);
  }

  ethGetBlockReceiptsByHash(
    parameters: EthGetBlockReceiptsByHashParameters,
    options?: options,
  ): Promise<readonly RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByHash<options>(this.requester, parameters, options);
  }

  ethGetBlockReceiptsByNumber(
    parameters: EthGetBlockReceiptsByNumberParameters,
    options?: options,
  ): Promise<readonly RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByNumber<options>(this.requester, parameters, options);
  }

  ethGetBlockReceiptsByTag(
    parameters: EthGetBlockReceiptsByTagParameters,
    options?: options,
  ): Promise<readonly RpcTransactionReceipt[] | null> {
    return ethGetBlockReceiptsByTag<options>(this.requester, parameters, options);
  }

  ethGetBlockTransactionCountByHash(
    parameters: EthGetBlockTransactionCountByHashParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBlockTransactionCountByHash<options>(this.requester, parameters, options);
  }

  ethGetBlockTransactionCountByNumber(
    parameters: EthGetBlockTransactionCountByNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBlockTransactionCountByNumber<options>(this.requester, parameters, options);
  }

  ethGetBlockTransactionCountByTag(
    parameters: EthGetBlockTransactionCountByTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetBlockTransactionCountByTag<options>(this.requester, parameters, options);
  }

  ethGetCodeByHash(parameters: EthGetCodeByHashParameters, options?: options): Promise<Hex> {
    return ethGetCodeByHash<options>(this.requester, parameters, options);
  }

  ethGetCodeByNumber(parameters: EthGetCodeByNumberParameters, options?: options): Promise<Hex> {
    return ethGetCodeByNumber<options>(this.requester, parameters, options);
  }

  ethGetCodeByTag(parameters: EthGetCodeByTagParameters, options?: options): Promise<Hex> {
    return ethGetCodeByTag<options>(this.requester, parameters, options);
  }

  ethGetFilterChanges<result extends FilterChange = RpcLog>(
    parameters: EthGetFilterChangesParameters,
    options?: options,
  ): Promise<readonly result[]> {
    return ethGetFilterChanges<result, options>(this.requester, parameters, options);
  }

  ethGetFilterLogs(
    parameters: EthGetFilterLogsParameters,
    options?: options,
  ): Promise<readonly RpcLog[]> {
    return ethGetFilterLogs<options>(this.requester, parameters, options);
  }

  ethGetLogsByHash(filter: LogsByHashFilter, options?: options): Promise<readonly RpcLog[]> {
    return ethGetLogsByHash<options>(this.requester, filter, options);
  }

  ethGetLogsByRange(filter: LogsByRangeFilter, options?: options): Promise<readonly RpcLog[]> {
    return ethGetLogsByRange<options>(this.requester, filter, options);
  }

  ethGetProofByHash(
    parameters: EthGetProofByHashParameters,
    options?: options,
  ): Promise<RpcAccountProof> {
    return ethGetProofByHash<options>(this.requester, parameters, options);
  }

  ethGetProofByNumber(
    parameters: EthGetProofByNumberParameters,
    options?: options,
  ): Promise<RpcAccountProof> {
    return ethGetProofByNumber<options>(this.requester, parameters, options);
  }

  ethGetProofByTag(
    parameters: EthGetProofByTagParameters,
    options?: options,
  ): Promise<RpcAccountProof> {
    return ethGetProofByTag<options>(this.requester, parameters, options);
  }

  ethGetStorageAtByHash(
    parameters: EthGetStorageAtByHashParameters,
    options?: options,
  ): Promise<Hex> {
    return ethGetStorageAtByHash<options>(this.requester, parameters, options);
  }

  ethGetStorageAtByNumber(
    parameters: EthGetStorageAtByNumberParameters,
    options?: options,
  ): Promise<Hex> {
    return ethGetStorageAtByNumber<options>(this.requester, parameters, options);
  }

  ethGetStorageAtByTag(
    parameters: EthGetStorageAtByTagParameters,
    options?: options,
  ): Promise<Hex> {
    return ethGetStorageAtByTag<options>(this.requester, parameters, options);
  }

  ethGetTransactionByBlockHashAndIndex(
    parameters: EthGetTransactionByBlockHashAndIndexParameters,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByBlockHashAndIndex<options>(this.requester, parameters, options);
  }

  ethGetTransactionByBlockNumberAndIndex(
    parameters: EthGetTransactionByBlockNumberAndIndexParameters,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByBlockNumberAndIndex<options>(this.requester, parameters, options);
  }

  ethGetTransactionByBlockTagAndIndex(
    parameters: EthGetTransactionByBlockTagAndIndexParameters,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByBlockTagAndIndex<options>(this.requester, parameters, options);
  }

  ethGetTransactionByHash(
    parameters: EthGetTransactionByHashParameters,
    options?: options,
  ): Promise<RpcTransaction | null> {
    return ethGetTransactionByHash<options>(this.requester, parameters, options);
  }

  ethGetTransactionCountByHash(
    parameters: EthGetTransactionCountByHashParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetTransactionCountByHash<options>(this.requester, parameters, options);
  }

  ethGetTransactionCountByNumber(
    parameters: EthGetTransactionCountByNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetTransactionCountByNumber<options>(this.requester, parameters, options);
  }

  ethGetTransactionCountByTag(
    parameters: EthGetTransactionCountByTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetTransactionCountByTag<options>(this.requester, parameters, options);
  }

  ethGetTransactionReceipt(
    parameters: EthGetTransactionReceiptParameters,
    options?: options,
  ): Promise<RpcTransactionReceipt | null> {
    return ethGetTransactionReceipt<options>(this.requester, parameters, options);
  }

  ethGetUncleByBlockHashAndIndex(
    parameters: EthGetUncleByBlockHashAndIndexParameters,
    options?: options,
  ): Promise<RpcBlock<false> | null> {
    return ethGetUncleByBlockHashAndIndex<options>(this.requester, parameters, options);
  }

  ethGetUncleByBlockNumberAndIndex(
    parameters: EthGetUncleByBlockNumberAndIndexParameters,
    options?: options,
  ): Promise<RpcBlock<false> | null> {
    return ethGetUncleByBlockNumberAndIndex<options>(this.requester, parameters, options);
  }

  ethGetUncleByBlockTagAndIndex(
    parameters: EthGetUncleByBlockTagAndIndexParameters,
    options?: options,
  ): Promise<RpcBlock<false> | null> {
    return ethGetUncleByBlockTagAndIndex<options>(this.requester, parameters, options);
  }

  ethGetUncleCountByBlockHash(
    parameters: EthGetUncleCountByBlockHashParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetUncleCountByBlockHash<options>(this.requester, parameters, options);
  }

  ethGetUncleCountByBlockNumber(
    parameters: EthGetUncleCountByBlockNumberParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetUncleCountByBlockNumber<options>(this.requester, parameters, options);
  }

  ethGetUncleCountByBlockTag(
    parameters: EthGetUncleCountByBlockTagParameters,
    options?: options,
  ): Promise<Quantity> {
    return ethGetUncleCountByBlockTag<options>(this.requester, parameters, options);
  }

  ethMaxPriorityFeePerGas(options?: options): Promise<Quantity> {
    return ethMaxPriorityFeePerGas<options>(this.requester, options);
  }

  ethNewBlockFilter(options?: options): Promise<Quantity> {
    return ethNewBlockFilter<options>(this.requester, options);
  }

  ethNewFilter(filter: LogsByRangeFilter, options?: options): Promise<Quantity> {
    return ethNewFilter<options>(this.requester, filter, options);
  }

  ethNewPendingTransactionFilter(options?: options): Promise<Quantity> {
    return ethNewPendingTransactionFilter<options>(this.requester, options);
  }

  ethSimulateV1ByHash(
    parameters: EthSimulateV1ByHashParameters,
    options?: options,
  ): Promise<readonly RpcSimulatedBlock[]> {
    return ethSimulateV1ByHash<options>(this.requester, parameters, options);
  }

  ethSimulateV1ByNumber(
    parameters: EthSimulateV1ByNumberParameters,
    options?: options,
  ): Promise<readonly RpcSimulatedBlock[]> {
    return ethSimulateV1ByNumber<options>(this.requester, parameters, options);
  }

  ethSimulateV1ByTag(
    parameters: EthSimulateV1ByTagParameters,
    options?: options,
  ): Promise<readonly RpcSimulatedBlock[]> {
    return ethSimulateV1ByTag<options>(this.requester, parameters, options);
  }

  ethSyncing(options?: options): Promise<false | RpcSyncingStatus> {
    return ethSyncing<options>(this.requester, options);
  }

  ethUninstallFilter(
    parameters: EthUninstallFilterParameters,
    options?: options,
  ): Promise<boolean> {
    return ethUninstallFilter<options>(this.requester, parameters, options);
  }

  netListening(options?: options): Promise<boolean> {
    return netListening<options>(this.requester, options);
  }

  netPeerCount(options?: options): Promise<Quantity> {
    return netPeerCount<options>(this.requester, options);
  }

  netVersion(options?: options): Promise<NetworkId> {
    return netVersion<options>(this.requester, options);
  }

  txpoolContent(options?: options): Promise<TxpoolContent> {
    return txpoolContent<options>(this.requester, options);
  }

  txpoolContentFrom(
    parameters: TxpoolContentFromParameters,
    options?: options,
  ): Promise<TxpoolContentFrom> {
    return txpoolContentFrom<options>(this.requester, parameters, options);
  }

  txpoolInspect(options?: options): Promise<TxpoolInspect> {
    return txpoolInspect<options>(this.requester, options);
  }

  txpoolStatus(options?: options): Promise<TxpoolStatus> {
    return txpoolStatus<options>(this.requester, options);
  }

  web3ClientVersion(options?: options): Promise<string> {
    return web3ClientVersion<options>(this.requester, options);
  }

  web3Sha3(parameters: Web3Sha3Parameters, options?: options): Promise<Hash> {
    return web3Sha3<options>(this.requester, parameters, options);
  }
}
