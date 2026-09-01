import {
  HttpTransport,
  type HttpRequestOptions,
  type HttpTransportOptions,
} from "@purevm/transports";

import {
  debugTraceBlockByHash,
  debugTraceBlockByNumber,
  debugTraceBlockByTag,
  debugTraceCallByNumber,
  debugTraceCallByTag,
  debugTraceTransaction,
  traceBlockByHash,
  traceBlockByNumber,
  traceBlockByTag,
  traceCallByNumber,
  traceCallByTag,
  traceCallManyByNumber,
  traceCallManyByTag,
  traceFilter,
  traceGet,
  traceReplayBlockTransactionsByNumber,
  traceReplayBlockTransactionsByTag,
  traceReplayTransaction,
  traceTransaction,
  type CallTracerConfig,
  type DebugBlockTrace,
  type DebugCallFrame,
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
  Quantity,
  TransactionHash,
} from "../types/primitives.js";
import { BaseClient } from "./base-client.js";

export class HttpClient extends BaseClient<HttpRequestOptions> {
  constructor(options: HttpTransportOptions) {
    super(new HttpTransport(options));
  }

  debugTraceCallByNumber(
    call: RpcCallRequest,
    blockNumber: BlockNumber,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugCallFrame> {
    return debugTraceCallByNumber(this.requester, call, blockNumber, config, options);
  }

  debugTraceCallByTag(
    call: RpcCallRequest,
    blockTag: BlockTag,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugCallFrame> {
    return debugTraceCallByTag(this.requester, call, blockTag, config, options);
  }

  debugTraceBlockByHash(
    blockHash: BlockHash,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace[]> {
    return debugTraceBlockByHash(this.requester, blockHash, config, options);
  }

  debugTraceBlockByNumber(
    blockNumber: BlockNumber,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace[]> {
    return debugTraceBlockByNumber(this.requester, blockNumber, config, options);
  }

  debugTraceBlockByTag(
    blockTag: BlockTag,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace[]> {
    return debugTraceBlockByTag(this.requester, blockTag, config, options);
  }

  debugTraceTransaction(
    transactionHash: TransactionHash,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugCallFrame> {
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
