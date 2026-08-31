import {
  HttpTransport,
  type HttpRequestOptions,
  type HttpTransportOptions,
} from "@purevm/transports";

import {
  debugTraceBlockByHash,
  debugTraceBlockByNumber,
  debugTraceBlockByTag,
  traceBlockByHash,
  traceBlockByNumber,
  traceBlockByTag,
  traceFilter,
  type CallTracerConfig,
  type DebugBlockTrace,
  type TraceEntry,
  type TraceFilterParameters,
} from "../actions/index.js";
import type { BlockHash, BlockNumber, BlockTag } from "../types/primitives.js";
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

  traceFilter(filter: TraceFilterParameters, options?: HttpRequestOptions): Promise<TraceEntry[]> {
    return traceFilter(this.requester, filter, options);
  }
}

export function createHttpClient(options: HttpTransportOptions): HttpClient {
  return new HttpClient(options);
}
