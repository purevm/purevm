import { resolveTimeout } from "../common/options.js";
import { createRequestIdGenerator } from "../common/request-id.js";
import { resolveRetry, withRetry } from "../common/retry.js";
import { parseRpcResponse } from "../common/rpc.js";
import {
  RpcAbortError,
  RpcSerializationError,
  RpcTimeoutError,
  WebSocketStoppedError,
} from "../errors/index.js";
import type {
  JsonValue,
  RequestOptions,
  RpcCall,
  RpcMethod,
  RpcId,
  RpcRequest,
  Transport,
} from "../types.js";
import { WebSocketConnection } from "./connection.js";
import { Heartbeat, resolveHeartbeat } from "./heartbeat.js";
import { LateSubscriptions } from "./late-subscriptions.js";
import { parseWebSocketMessage } from "./message.js";
import { PendingRequests } from "./pending.js";
import { resolveReconnect, type ResolvedReconnectOptions } from "./reconnect.js";
import { defaultWebSocketFactory } from "./socket.js";
import { SubscriptionManager } from "./subscriber.js";
import type {
  HeartbeatMethod,
  RpcSubscription,
  SubscribeOptions,
  WebSocketTransportOptions,
} from "./types.js";
import { parseWebSocketUrl } from "./url.js";

type SubscribeMethod = {
  method: "eth_subscribe";
  params: readonly JsonValue[];
  result: string;
};

type HeartbeatCall = {
  method: HeartbeatMethod;
  params?: undefined;
  result: unknown;
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
  private readonly lateSubscriptions = new LateSubscriptions();
  private readonly subscriber: SubscriptionManager;
  private readonly nextId = createRequestIdGenerator();
  private readonly reconnect: false | ResolvedReconnectOptions;
  private readonly reconnectAbort = new AbortController();
  private readonly heartbeat?: Heartbeat;
  private reconnecting?: Promise<void>;
  private reconnectRequested = false;
  private stopped = false;

  constructor(options: WebSocketTransportOptions) {
    this.url = parseWebSocketUrl(options.url);
    this.reconnect = resolveReconnect(options.reconnect);
    const heartbeat = resolveHeartbeat(options.heartbeat);
    this.options = options;
    this.connection = new WebSocketConnection(
      this.url,
      options.createWebSocket ?? defaultWebSocketFactory,
      {
        onOpen: () => this.heartbeat?.start(),
        onMessage: (data) => this.handleMessage(data),
        onError: (error) => this.report(error),
        onClose: (error) => this.handleClose(error),
      },
      resolveTimeout(options, {}),
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
    if (heartbeat !== false) {
      this.heartbeat = new Heartbeat(
        heartbeat,
        (method, timeoutMs) => this.request<HeartbeatCall>({ method }, { retry: false, timeoutMs }),
        (error) => {
          this.report(error);
          this.connection.drop(error);
        },
      );
    }
  }

  get connected(): boolean {
    return this.connection.connected;
  }

  async connect(options: RequestOptions = {}): Promise<void> {
    if (this.stopped) throw new WebSocketStoppedError();
    const timeoutMs = resolveTimeout(this.options, options);
    await this.connection.connect(timeoutMs, options.signal);
    // Any successful connection restores subscriptions left unbound by a drop.
    if (!this.reconnecting && this.subscriber.hasUnbound) this.restoreSubscriptions(false);
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
    this.reconnectAbort.abort();
    this.heartbeat?.stop();
    this.lateSubscriptions.clear();
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
    try {
      return (await response) as method["result"];
    } catch (error) {
      // The provider may still create the subscription after the caller gave up.
      if (
        call.method === "eth_subscribe" &&
        (error instanceof RpcTimeoutError || error instanceof RpcAbortError)
      ) {
        this.lateSubscriptions.track(request.id);
      }
      throw error;
    }
  }

  private handleMessage(data: unknown): void {
    this.heartbeat?.touch();
    try {
      const message = parseWebSocketMessage(data);
      if (message.type === "subscription") {
        this.subscriber.handle(message.id, message.result);
        return;
      }

      if (!this.pending.has(message.id)) {
        if (this.lateSubscriptions.take(message.id)) {
          this.releaseLateSubscription(message.response, message.id);
        }
        return;
      }
      try {
        this.pending.resolve(message.id, parseRpcResponse(message.response, message.id));
      } catch (error) {
        this.pending.reject(message.id, error);
      }
    } catch (error) {
      this.report(normalizeError(error));
    }
  }

  private releaseLateSubscription(response: unknown, requestId: RpcId): void {
    let id: unknown;
    try {
      id = parseRpcResponse(response, requestId);
    } catch {
      return;
    }
    if (typeof id !== "string") return;
    this.request<UnsubscribeMethod>(
      { method: "eth_unsubscribe", params: [id] },
      { retry: false },
    ).catch(() => undefined);
  }

  private handleClose(error: Error): void {
    this.heartbeat?.stop();
    // Server-side subscriptions die with the socket.
    this.lateSubscriptions.clear();
    this.pending.rejectAll(error);
    this.subscriber.disconnected();
    if (this.stopped || this.reconnect === false || this.subscriber.size === 0) return;
    if (this.reconnecting) this.reconnectRequested = true;
    else this.restoreSubscriptions(true);
  }

  /**
   * Reconnects when needed and resubscribes unbound subscriptions. A drop-triggered run follows
   * the reconnect policy; a run triggered by an external connection makes a single attempt.
   */
  private restoreSubscriptions(afterDrop: boolean): void {
    if (this.reconnecting || this.stopped) return;
    const policy = afterDrop && this.reconnect !== false ? this.reconnect : undefined;
    const retry = {
      retries: policy?.retries ?? 0,
      delayMs: policy?.delayMs ?? 0,
      maxDelayMs: policy?.maxDelayMs ?? 0,
      factor: policy?.factor ?? 1,
      shouldRetry: (error: unknown) => {
        if (this.stopped) return false;
        this.report(normalizeError(error));
        return true;
      },
    };
    const reconnecting = withRetry(
      async () => {
        const timeoutMs = resolveTimeout(this.options, {});
        await this.connection.connect(timeoutMs, this.reconnectAbort.signal);
        await this.subscriber.restore();
      },
      retry,
      this.reconnectAbort.signal,
    )
      .catch((error: unknown) => {
        if (!this.stopped) this.report(normalizeError(error));
      })
      .finally(() => {
        if (this.reconnecting === reconnecting) this.reconnecting = undefined;
        if (this.reconnectRequested && !this.stopped && this.subscriber.size > 0) {
          this.reconnectRequested = false;
          this.restoreSubscriptions(true);
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
