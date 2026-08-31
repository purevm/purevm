import {
  HttpTransport,
  type HttpRequestOptions,
  type HttpTransportOptions,
} from "@purevm/transports";

import {
  debugTraceBlockByHash,
  debugTraceBlockByNumber,
  traceBlockByHash,
  traceBlockByNumber,
  traceFilter,
  type CallTracerConfig,
  type DebugBlockTrace,
  type TraceEntry,
  type TraceFilterParameters,
} from "../actions/index.js";
import type { BlockHash, BlockNumberOrTag } from "../types/primitives.js";
import { BaseClient } from "./base-client.js";

export class HttpClient extends BaseClient<HttpRequestOptions> {
  constructor(options: HttpTransportOptions) {
    super(new HttpTransport(options));
  }

  debugTraceBlockByHash(
    blockHash: BlockHash,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace[]> {
    return debugTraceBlockByHash(this.requester, blockHash, config, options);
  }

  debugTraceBlockByNumber(
    blockNumber: BlockNumberOrTag,
    config?: CallTracerConfig,
    options?: HttpRequestOptions,
  ): Promise<DebugBlockTrace[]> {
    return debugTraceBlockByNumber(this.requester, blockNumber, config, options);
  }

  traceBlockByHash(blockHash: BlockHash, options?: HttpRequestOptions): Promise<TraceEntry[]> {
    return traceBlockByHash(this.requester, blockHash, options);
  }

  traceBlockByNumber(
    blockNumber: BlockNumberOrTag,
    options?: HttpRequestOptions,
  ): Promise<TraceEntry[]> {
    return traceBlockByNumber(this.requester, blockNumber, options);
  }

  traceFilter(filter: TraceFilterParameters, options?: HttpRequestOptions): Promise<TraceEntry[]> {
    return traceFilter(this.requester, filter, options);
  }
}

export function createHttpClient(options: HttpTransportOptions): HttpClient {
  return new HttpClient(options);
}
