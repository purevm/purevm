import {
  HttpTransport,
  type HttpRequestOptions,
  type HttpTransportOptions,
} from "@purevm/transports";

import {
  debugGetBadBlocks,
  debugGetRawBlockByHash,
  debugGetRawBlockByNumber,
  debugGetRawBlockByTag,
  debugGetRawHeaderByHash,
  debugGetRawHeaderByNumber,
  debugGetRawHeaderByTag,
  debugGetRawReceiptsByHash,
  debugGetRawReceiptsByNumber,
  debugGetRawReceiptsByTag,
  debugGetRawTransaction,
  debugTraceBlockByHash,
  debugTraceBlockByNumber,
  debugTraceBlockByTag,
  debugTraceCallByHash,
  debugTraceCallByNumber,
  debugTraceCallByTag,
  debugTraceTransaction,
  traceBlockByHash,
  traceBlockByNumber,
  traceBlockByTag,
  traceCallByHash,
  traceCallByNumber,
  traceCallByTag,
  traceCallManyByHash,
  traceCallManyByNumber,
  traceCallManyByTag,
  traceFilter,
  traceGet,
  traceReplayBlockTransactionsByHash,
  traceReplayBlockTransactionsByNumber,
  traceReplayBlockTransactionsByTag,
  traceReplayTransaction,
  traceTransaction,
  type CallTracerConfig,
  type DebugBadBlock,
  type DebugBlockTrace,
  type DebugTraceCallConfig,
  type DebugTraceConfig,
  type DebugTraceResult,
  type RpcCallRequest,
  type TraceCallManyEntry,
  type TraceEntry,
  type TraceFilterParameters,
  type TraceReplayResult,
  type TraceReplayTransactionResult,
  type TraceType,
} from "../actions/index.js";
import type {
  BlockHash,
  BlockNumber,
  BlockTag,
  Hex,
  Quantity,
  TransactionHash,
} from "../types/primitives.js";
import { BaseClient } from "./base-client.js";

export class HttpClient extends BaseClient<HttpRequestOptions> {
  constructor(options: HttpTransportOptions) {
    super(new HttpTransport(options));
  }

  debugGetBadBlocks(options?: HttpRequestOptions): Promise<DebugBadBlock[]> {
    return debugGetBadBlocks(this.requester, options);
  }

  debugGetRawBlockByHash(blockHash: BlockHash, options?: HttpRequestOptions): Promise<Hex> {
    return debugGetRawBlockByHash(this.requester, blockHash, options);
  }

  debugGetRawBlockByNumber(blockNumber: BlockNumber, options?: HttpRequestOptions): Promise<Hex> {
    return debugGetRawBlockByNumber(this.requester, blockNumber, options);
  }

  debugGetRawBlockByTag(blockTag: BlockTag, options?: HttpRequestOptions): Promise<Hex> {
    return debugGetRawBlockByTag(this.requester, blockTag, options);
  }

  debugGetRawHeaderByHash(blockHash: BlockHash, options?: HttpRequestOptions): Promise<Hex> {
    return debugGetRawHeaderByHash(this.requester, blockHash, options);
  }

  debugGetRawHeaderByNumber(blockNumber: BlockNumber, options?: HttpRequestOptions): Promise<Hex> {
    return debugGetRawHeaderByNumber(this.requester, blockNumber, options);
  }

  debugGetRawHeaderByTag(blockTag: BlockTag, options?: HttpRequestOptions): Promise<Hex> {
    return debugGetRawHeaderByTag(this.requester, blockTag, options);
  }

  debugGetRawReceiptsByHash(blockHash: BlockHash, options?: HttpRequestOptions): Promise<Hex[]> {
    return debugGetRawReceiptsByHash(this.requester, blockHash, options);
  }

  debugGetRawReceiptsByNumber(
    blockNumber: BlockNumber,
    options?: HttpRequestOptions,
  ): Promise<Hex[]> {
    return debugGetRawReceiptsByNumber(this.requester, blockNumber, options);
  }

  debugGetRawReceiptsByTag(blockTag: BlockTag, options?: HttpRequestOptions): Promise<Hex[]> {
    return debugGetRawReceiptsByTag(this.requester, blockTag, options);
  }

  debugGetRawTransaction(
    transactionHash: TransactionHash,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawTransaction(this.requester, transactionHash, options);
  }

  debugTraceBlockByHash<const config extends DebugTraceConfig = CallTracerConfig>(
    blockHash: BlockHash,
    config?: config,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace<DebugTraceResult<config>>[]> {
    return debugTraceBlockByHash(this.requester, blockHash, config, options);
  }

  debugTraceBlockByNumber<const config extends DebugTraceConfig = CallTracerConfig>(
    blockNumber: BlockNumber,
    config?: config,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace<DebugTraceResult<config>>[]> {
    return debugTraceBlockByNumber(this.requester, blockNumber, config, options);
  }

  debugTraceBlockByTag<const config extends DebugTraceConfig = CallTracerConfig>(
    blockTag: BlockTag,
    config?: config,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace<DebugTraceResult<config>>[]> {
    return debugTraceBlockByTag(this.requester, blockTag, config, options);
  }

  debugTraceCallByHash<const config extends DebugTraceCallConfig = CallTracerConfig>(
    call: RpcCallRequest,
    blockHash: BlockHash,
    config?: config,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceCallByHash(this.requester, call, blockHash, config, options);
  }

  debugTraceCallByNumber<const config extends DebugTraceCallConfig = CallTracerConfig>(
    call: RpcCallRequest,
    blockNumber: BlockNumber,
    config?: config,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceCallByNumber(this.requester, call, blockNumber, config, options);
  }

  debugTraceCallByTag<const config extends DebugTraceCallConfig = CallTracerConfig>(
    call: RpcCallRequest,
    blockTag: BlockTag,
    config?: config,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceCallByTag(this.requester, call, blockTag, config, options);
  }

  debugTraceTransaction<const config extends DebugTraceConfig = CallTracerConfig>(
    transactionHash: TransactionHash,
    config?: config,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceTransaction(this.requester, transactionHash, config, options);
  }

  traceBlockByHash(blockHash: BlockHash, options?: HttpRequestOptions): Promise<TraceEntry[]> {
    return traceBlockByHash(this.requester, blockHash, options);
  }

  traceBlockByNumber(
    blockNumber: BlockNumber,
    options?: HttpRequestOptions,
  ): Promise<TraceEntry[]> {
    return traceBlockByNumber(this.requester, blockNumber, options);
  }

  traceBlockByTag(blockTag: BlockTag, options?: HttpRequestOptions): Promise<TraceEntry[]> {
    return traceBlockByTag(this.requester, blockTag, options);
  }

  traceCallByHash(
    call: RpcCallRequest,
    traceTypes: readonly TraceType[],
    blockHash: BlockHash,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceCallByHash(this.requester, call, traceTypes, blockHash, options);
  }

  traceCallByNumber(
    call: RpcCallRequest,
    traceTypes: readonly TraceType[],
    blockNumber: BlockNumber,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceCallByNumber(this.requester, call, traceTypes, blockNumber, options);
  }

  traceCallByTag(
    call: RpcCallRequest,
    traceTypes: readonly TraceType[],
    blockTag: BlockTag,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceCallByTag(this.requester, call, traceTypes, blockTag, options);
  }

  traceCallManyByHash(
    calls: readonly TraceCallManyEntry[],
    blockHash: BlockHash,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult[]> {
    return traceCallManyByHash(this.requester, calls, blockHash, options);
  }

  traceCallManyByNumber(
    calls: readonly TraceCallManyEntry[],
    blockNumber: BlockNumber,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult[]> {
    return traceCallManyByNumber(this.requester, calls, blockNumber, options);
  }

  traceCallManyByTag(
    calls: readonly TraceCallManyEntry[],
    blockTag: BlockTag,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult[]> {
    return traceCallManyByTag(this.requester, calls, blockTag, options);
  }

  traceFilter(filter: TraceFilterParameters, options?: HttpRequestOptions): Promise<TraceEntry[]> {
    return traceFilter(this.requester, filter, options);
  }

  traceGet(
    transactionHash: TransactionHash,
    traceAddress: readonly Quantity[],
    options?: HttpRequestOptions,
  ): Promise<TraceEntry | null> {
    return traceGet(this.requester, transactionHash, traceAddress, options);
  }

  traceReplayBlockTransactionsByHash(
    blockHash: BlockHash,
    traceTypes: readonly TraceType[],
    options?: HttpRequestOptions,
  ): Promise<TraceReplayTransactionResult[]> {
    return traceReplayBlockTransactionsByHash(this.requester, blockHash, traceTypes, options);
  }

  traceReplayBlockTransactionsByNumber(
    blockNumber: BlockNumber,
    traceTypes: readonly TraceType[],
    options?: HttpRequestOptions,
  ): Promise<TraceReplayTransactionResult[]> {
    return traceReplayBlockTransactionsByNumber(this.requester, blockNumber, traceTypes, options);
  }

  traceReplayBlockTransactionsByTag(
    blockTag: BlockTag,
    traceTypes: readonly TraceType[],
    options?: HttpRequestOptions,
  ): Promise<TraceReplayTransactionResult[]> {
    return traceReplayBlockTransactionsByTag(this.requester, blockTag, traceTypes, options);
  }

  traceReplayTransaction(
    transactionHash: TransactionHash,
    traceTypes: readonly TraceType[],
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceReplayTransaction(this.requester, transactionHash, traceTypes, options);
  }

  traceTransaction(
    transactionHash: TransactionHash,
    options?: HttpRequestOptions,
  ): Promise<TraceEntry[]> {
    return traceTransaction(this.requester, transactionHash, options);
  }
}

export function createHttpClient(options: HttpTransportOptions): HttpClient {
  return new HttpClient(options);
}
