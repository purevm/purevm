import { resolveTimeout } from "../common/options.js";
import { createRequestIdGenerator } from "../common/request-id.js";
import { resolveRetry, withRetry } from "../common/retry.js";
import { createTimeoutContext } from "../common/timeout.js";
import {
  RpcAbortError,
  RpcNetworkError,
  RpcSerializationError,
  RpcTimeoutError,
  TransportError,
} from "../errors/index.js";
import type { RpcCall, RpcMethod, RpcRequest, Transport } from "../types.js";
import { createHeaders } from "./headers.js";
import { parseHttpResponse } from "./response.js";
import type { HttpRequestOptions, HttpTransportOptions } from "./types.js";
import { parseHttpUrl } from "./url.js";

export class HttpTransport implements Transport {
  readonly url: string;

  private readonly authorization?: string;
  private readonly options: HttpTransportOptions;
  private readonly fetch: typeof globalThis.fetch;
  private readonly nextId = createRequestIdGenerator();

  constructor(options: HttpTransportOptions) {
    const parsed = parseHttpUrl(options.url);
    const fetcher = options.fetch ?? globalThis.fetch;
    if (!fetcher) throw new TypeError("No fetch implementation available.");

    this.url = parsed.url;
    this.authorization = parsed.authorization;
    this.options = options;
    this.fetch = fetcher;
  }

  async request<method extends RpcMethod>(
    call: RpcCall<method>,
    options: HttpRequestOptions = {},
  ): Promise<method["result"]> {
    const timeoutMs = resolveTimeout(this.options, options);
    const retry = resolveRetry(this.options, options);

    return withRetry(
      () => this.requestOnce<method>(call, options, timeoutMs),
      retry,
      options.signal,
    );
  }

  private async requestOnce<method extends RpcMethod>(
    call: RpcCall<method>,
    options: HttpRequestOptions,
    timeoutMs: number,
  ): Promise<method["result"]> {
    const request = createRequest(this.nextId(), call);
    let body: string;
    try {
      body = JSON.stringify(request);
    } catch (cause) {
      throw new RpcSerializationError(cause);
    }

    const timeout = createTimeoutContext(timeoutMs, options.signal);
    try {
      const response = await this.fetch(this.url, {
        method: "POST",
        headers: createHeaders(this.authorization, this.options.headers, options.headers),
        body,
        signal: timeout.signal,
      });
      const text = await response.text();
      return parseHttpResponse(response, text, request.id) as method["result"];
    } catch (error) {
      if (timeout.timedOut) throw new RpcTimeoutError(timeoutMs, error);
      if (options.signal?.aborted) throw new RpcAbortError(options.signal.reason);
      if (error instanceof TransportError) throw error;
      throw new RpcNetworkError(error);
    } finally {
      timeout.dispose();
    }
  }
}

function createRequest<method extends RpcMethod>(id: number, call: RpcCall<method>): RpcRequest {
  return call.params === undefined
    ? { id, jsonrpc: "2.0", method: call.method }
    : { id, jsonrpc: "2.0", method: call.method, params: call.params };
}
