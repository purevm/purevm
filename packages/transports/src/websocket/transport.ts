import { resolveTimeout } from "../common/options.js";
import { createRequestIdGenerator } from "../common/request-id.js";
import { resolveRetry, withRetry } from "../common/retry.js";
import { parseRpcResponse } from "../common/rpc.js";
import { RpcSerializationError, WebSocketStoppedError } from "../errors/index.js";
import type {
  JsonValue,
  RequestOptions,
  RpcCall,
  RpcMethod,
  RpcRequest,
  Transport,
} from "../types.js";
import { WebSocketConnection } from "./connection.js";
import { parseWebSocketMessage } from "./message.js";
import { PendingRequests } from "./pending.js";
import { defaultWebSocketFactory } from "./socket.js";
import { SubscriptionManager } from "./subscriber.js";
import type { RpcSubscription, SubscribeOptions, WebSocketTransportOptions } from "./types.js";
import { parseWebSocketUrl } from "./url.js";

type SubscribeMethod = {
  method: "eth_subscribe";
  params: readonly JsonValue[];
  result: string;
};

type UnsubscribeMethod = {
  method: "eth_unsubscribe";
  params: readonly [string];
  result: boolean;
};

export class WebSocketTransport implements Transport {
  readonly url: string;

  private readonly options: WebSocketTransportOptions;
  private readonly connection: WebSocketConnection;
  private readonly pending = new PendingRequests();
  private readonly subscriber: SubscriptionManager;
  private readonly nextId = createRequestIdGenerator();
  private reconnecting?: Promise<void>;
  private reconnectRequested = false;
  private stopped = false;

  constructor(options: WebSocketTransportOptions) {
    this.url = parseWebSocketUrl(options.url);
    this.options = options;
    this.connection = new WebSocketConnection(
      this.url,
      options.createWebSocket ?? defaultWebSocketFactory,
      {
        onMessage: (data) => this.handleMessage(data),
        onError: (error) => this.report(error),
        onClose: (error) => this.handleClose(error),
      },
    );
    this.subscriber = new SubscriptionManager(
      (params, requestOptions) =>
        this.request<SubscribeMethod>({ method: "eth_subscribe", params }, requestOptions),
      (id, requestOptions) =>
        this.request<UnsubscribeMethod>(
          { method: "eth_unsubscribe", params: [id] },
          requestOptions,
        ),
      (error) => this.report(error),
    );
  }

  get connected(): boolean {
    return this.connection.connected;
  }

  async connect(options: RequestOptions = {}): Promise<void> {
    if (this.stopped) throw new WebSocketStoppedError();
    const timeoutMs = resolveTimeout(this.options, options);
    await this.connection.connect(timeoutMs, options.signal);
  }

  async request<method extends RpcMethod>(
    call: RpcCall<method>,
    options: RequestOptions = {},
  ): Promise<method["result"]> {
    if (this.stopped) throw new WebSocketStoppedError();
    const timeoutMs = resolveTimeout(this.options, options);
    const retry = resolveRetry(this.options, options);
    return withRetry(
      () => this.requestOnce<method>(call, options, timeoutMs),
      retry,
      options.signal,
    );
  }

  async subscribe<result>(
    options: SubscribeOptions<result>,
    requestOptions: RequestOptions = {},
  ): Promise<RpcSubscription> {
    return this.subscriber.subscribe(options, requestOptions);
  }

  close(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.pending.rejectAll(new WebSocketStoppedError());
    this.subscriber.disconnected();
    this.connection.close();
  }

  private async requestOnce<method extends RpcMethod>(
    call: RpcCall<method>,
    options: RequestOptions,
    timeoutMs: number,
  ): Promise<method["result"]> {
    await this.connect({ signal: options.signal, timeoutMs });
    const request = createRequest(this.nextId(), call);
    let body: string;
    try {
      body = JSON.stringify(request);
    } catch (cause) {
      throw new RpcSerializationError(cause);
    }

    const response = this.pending.add(request.id, timeoutMs, options.signal);
    try {
      this.connection.send(body);
    } catch (cause) {
      this.pending.reject(request.id, cause);
    }
    return (await response) as method["result"];
  }

  private handleMessage(data: unknown): void {
    try {
      const message = parseWebSocketMessage(data);
      if (message.type === "subscription") {
        this.subscriber.handle(message.id, message.result);
        return;
      }

      if (!this.pending.has(message.id)) return;
      try {
        this.pending.resolve(message.id, parseRpcResponse(message.response, message.id));
      } catch (error) {
        this.pending.reject(message.id, error);
      }
    } catch (error) {
      this.report(normalizeError(error));
    }
  }

  private handleClose(error: Error): void {
    this.pending.rejectAll(error);
    this.subscriber.disconnected();
    if (this.stopped || this.subscriber.size === 0) return;
    if (this.reconnecting) this.reconnectRequested = true;
    else this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnecting || this.stopped) return;
    const retry = resolveRetry(this.options, {});
    const reconnectRetry = retry === false ? false : { ...retry, shouldRetry: () => true };
    const reconnecting = withRetry(async () => {
      await this.connect();
      await this.subscriber.restore();
    }, reconnectRetry)
      .catch((error: unknown) => this.report(normalizeError(error)))
      .finally(() => {
        if (this.reconnecting === reconnecting) this.reconnecting = undefined;
        if (this.reconnectRequested && !this.stopped && this.subscriber.size > 0) {
          this.reconnectRequested = false;
          this.scheduleReconnect();
        }
      });
    this.reconnecting = reconnecting;
  }

  private report(error: Error): void {
    this.options.onError?.(error);
  }
}

function createRequest<method extends RpcMethod>(id: number, call: RpcCall<method>): RpcRequest {
  return call.params === undefined
    ? { id, jsonrpc: "2.0", method: call.method }
    : { id, jsonrpc: "2.0", method: call.method, params: call.params };
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
