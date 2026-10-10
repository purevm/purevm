import {
  HttpTransport,
  type HttpRequestOptions,
  type HttpTransportOptions,
} from "@purevm/rpc-transport";

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
  type DebugGetRawBlockByHashParameters,
  type DebugGetRawBlockByNumberParameters,
  type DebugGetRawBlockByTagParameters,
  type DebugGetRawHeaderByHashParameters,
  type DebugGetRawHeaderByNumberParameters,
  type DebugGetRawHeaderByTagParameters,
  type DebugGetRawReceiptsByHashParameters,
  type DebugGetRawReceiptsByNumberParameters,
  type DebugGetRawReceiptsByTagParameters,
  type DebugGetRawTransactionParameters,
  type DebugTraceBlockByHashParameters,
  type DebugTraceBlockByNumberParameters,
  type DebugTraceBlockByTagParameters,
  type DebugTraceCallByHashParameters,
  type DebugTraceCallByNumberParameters,
  type DebugTraceCallByTagParameters,
  type DebugTraceCallConfig,
  type DebugTraceConfig,
  type DebugTraceResult,
  type DebugTraceTransactionParameters,
  type TraceBlockByHashParameters,
  type TraceBlockByNumberParameters,
  type TraceBlockByTagParameters,
  type TraceCallByHashParameters,
  type TraceCallByNumberParameters,
  type TraceCallByTagParameters,
  type TraceCallManyByHashParameters,
  type TraceCallManyByNumberParameters,
  type TraceCallManyByTagParameters,
  type TraceEntry,
  type TraceFilterParameters,
  type TraceGetParameters,
  type TraceReplayBlockTransactionsByHashParameters,
  type TraceReplayBlockTransactionsByNumberParameters,
  type TraceReplayBlockTransactionsByTagParameters,
  type TraceReplayResult,
  type TraceReplayTransactionParameters,
  type TraceReplayTransactionResult,
  type TraceTransactionParameters,
} from "../actions/index.js";
import type { Hex } from "../types/primitives.js";
import { BaseClient } from "./base-client.js";

export class HttpClient extends BaseClient<HttpRequestOptions> {
  constructor(options: HttpTransportOptions) {
    super(new HttpTransport(options));
  }

  debugGetBadBlocks(options?: HttpRequestOptions): Promise<readonly DebugBadBlock[]> {
    return debugGetBadBlocks(this.requester, options);
  }

  debugGetRawBlockByHash(
    parameters: DebugGetRawBlockByHashParameters,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawBlockByHash(this.requester, parameters, options);
  }

  debugGetRawBlockByNumber(
    parameters: DebugGetRawBlockByNumberParameters,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawBlockByNumber(this.requester, parameters, options);
  }

  debugGetRawBlockByTag(
    parameters: DebugGetRawBlockByTagParameters,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawBlockByTag(this.requester, parameters, options);
  }

  debugGetRawHeaderByHash(
    parameters: DebugGetRawHeaderByHashParameters,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawHeaderByHash(this.requester, parameters, options);
  }

  debugGetRawHeaderByNumber(
    parameters: DebugGetRawHeaderByNumberParameters,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawHeaderByNumber(this.requester, parameters, options);
  }

  debugGetRawHeaderByTag(
    parameters: DebugGetRawHeaderByTagParameters,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawHeaderByTag(this.requester, parameters, options);
  }

  debugGetRawReceiptsByHash(
    parameters: DebugGetRawReceiptsByHashParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly Hex[]> {
    return debugGetRawReceiptsByHash(this.requester, parameters, options);
  }

  debugGetRawReceiptsByNumber(
    parameters: DebugGetRawReceiptsByNumberParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly Hex[]> {
    return debugGetRawReceiptsByNumber(this.requester, parameters, options);
  }

  debugGetRawReceiptsByTag(
    parameters: DebugGetRawReceiptsByTagParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly Hex[]> {
    return debugGetRawReceiptsByTag(this.requester, parameters, options);
  }

  debugGetRawTransaction(
    parameters: DebugGetRawTransactionParameters,
    options?: HttpRequestOptions,
  ): Promise<Hex> {
    return debugGetRawTransaction(this.requester, parameters, options);
  }

  debugTraceBlockByHash<const config extends DebugTraceConfig = CallTracerConfig>(
    parameters: DebugTraceBlockByHashParameters<config>,
    options?: HttpRequestOptions,
  ): Promise<readonly DebugBlockTrace<DebugTraceResult<config>>[]> {
    return debugTraceBlockByHash<config>(this.requester, parameters, options);
  }

  debugTraceBlockByNumber<const config extends DebugTraceConfig = CallTracerConfig>(
    parameters: DebugTraceBlockByNumberParameters<config>,
    options?: HttpRequestOptions,
  ): Promise<readonly DebugBlockTrace<DebugTraceResult<config>>[]> {
    return debugTraceBlockByNumber<config>(this.requester, parameters, options);
  }

  debugTraceBlockByTag<const config extends DebugTraceConfig = CallTracerConfig>(
    parameters: DebugTraceBlockByTagParameters<config>,
    options?: HttpRequestOptions,
  ): Promise<readonly DebugBlockTrace<DebugTraceResult<config>>[]> {
    return debugTraceBlockByTag<config>(this.requester, parameters, options);
  }

  debugTraceCallByHash<const config extends DebugTraceCallConfig = CallTracerConfig>(
    parameters: DebugTraceCallByHashParameters<config>,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceCallByHash<config>(this.requester, parameters, options);
  }

  debugTraceCallByNumber<const config extends DebugTraceCallConfig = CallTracerConfig>(
    parameters: DebugTraceCallByNumberParameters<config>,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceCallByNumber<config>(this.requester, parameters, options);
  }

  debugTraceCallByTag<const config extends DebugTraceCallConfig = CallTracerConfig>(
    parameters: DebugTraceCallByTagParameters<config>,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceCallByTag<config>(this.requester, parameters, options);
  }

  debugTraceTransaction<const config extends DebugTraceConfig = CallTracerConfig>(
    parameters: DebugTraceTransactionParameters<config>,
    options?: HttpRequestOptions,
  ): Promise<DebugTraceResult<config>> {
    return debugTraceTransaction<config>(this.requester, parameters, options);
  }

  traceBlockByHash(
    parameters: TraceBlockByHashParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceEntry[]> {
    return traceBlockByHash(this.requester, parameters, options);
  }

  traceBlockByNumber(
    parameters: TraceBlockByNumberParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceEntry[]> {
    return traceBlockByNumber(this.requester, parameters, options);
  }

  traceBlockByTag(
    parameters: TraceBlockByTagParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceEntry[]> {
    return traceBlockByTag(this.requester, parameters, options);
  }

  traceCallByHash(
    parameters: TraceCallByHashParameters,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceCallByHash(this.requester, parameters, options);
  }

  traceCallByNumber(
    parameters: TraceCallByNumberParameters,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceCallByNumber(this.requester, parameters, options);
  }

  traceCallByTag(
    parameters: TraceCallByTagParameters,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceCallByTag(this.requester, parameters, options);
  }

  traceCallManyByHash(
    parameters: TraceCallManyByHashParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceReplayResult[]> {
    return traceCallManyByHash(this.requester, parameters, options);
  }

  traceCallManyByNumber(
    parameters: TraceCallManyByNumberParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceReplayResult[]> {
    return traceCallManyByNumber(this.requester, parameters, options);
  }

  traceCallManyByTag(
    parameters: TraceCallManyByTagParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceReplayResult[]> {
    return traceCallManyByTag(this.requester, parameters, options);
  }

  traceFilter(
    filter: TraceFilterParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceEntry[]> {
    return traceFilter(this.requester, filter, options);
  }

  traceGet(
    parameters: TraceGetParameters,
    options?: HttpRequestOptions,
  ): Promise<TraceEntry | null> {
    return traceGet(this.requester, parameters, options);
  }

  traceReplayBlockTransactionsByHash(
    parameters: TraceReplayBlockTransactionsByHashParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceReplayTransactionResult[]> {
    return traceReplayBlockTransactionsByHash(this.requester, parameters, options);
  }

  traceReplayBlockTransactionsByNumber(
    parameters: TraceReplayBlockTransactionsByNumberParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceReplayTransactionResult[]> {
    return traceReplayBlockTransactionsByNumber(this.requester, parameters, options);
  }

  traceReplayBlockTransactionsByTag(
    parameters: TraceReplayBlockTransactionsByTagParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceReplayTransactionResult[]> {
    return traceReplayBlockTransactionsByTag(this.requester, parameters, options);
  }

  traceReplayTransaction(
    parameters: TraceReplayTransactionParameters,
    options?: HttpRequestOptions,
  ): Promise<TraceReplayResult> {
    return traceReplayTransaction(this.requester, parameters, options);
  }

  traceTransaction(
    parameters: TraceTransactionParameters,
    options?: HttpRequestOptions,
  ): Promise<readonly TraceEntry[]> {
    return traceTransaction(this.requester, parameters, options);
  }
}

export function createHttpClient(options: HttpTransportOptions): HttpClient {
  return new HttpClient(options);
}
