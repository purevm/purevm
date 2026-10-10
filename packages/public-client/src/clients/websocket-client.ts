import {
  WebSocketTransport,
  type RequestOptions,
  type RpcSubscription,
  type WebSocketTransportOptions,
} from "@purevm/rpc-transport";

import type {
  LogsSubscriptionFilter,
  LogsSubscriptionResult,
  NewHeadsSubscriptionResult,
  PendingTransactionSubscriptionResult,
  SyncingSubscriptionResult,
} from "../actions/eth/index.js";
import { BaseClient } from "./base-client.js";

export type SubscriptionHandlers<result> = {
  onData(result: result): void;
  onError?: ((error: Error) => void) | undefined;
};

export type LogsSubscriptionOptions = SubscriptionHandlers<LogsSubscriptionResult> & {
  filter?: LogsSubscriptionFilter | undefined;
};

export type PendingTransactionsSubscriptionOptions<full extends boolean = false> =
  SubscriptionHandlers<PendingTransactionSubscriptionResult<full>> & {
    fullTransactions?: full | undefined;
  };

export class WebSocketClient extends BaseClient<RequestOptions> {
  readonly transport: WebSocketTransport;

  constructor(options: WebSocketTransportOptions) {
    const transport = new WebSocketTransport(options);
    super(transport);
    this.transport = transport;
  }

  get connected(): boolean {
    return this.transport.connected;
  }

  connect(options?: RequestOptions): Promise<void> {
    return this.transport.connect(options);
  }

  close(): void {
    this.transport.close();
  }

  ethSubscribeLogs(
    options: LogsSubscriptionOptions,
    requestOptions?: RequestOptions,
  ): Promise<RpcSubscription> {
    const params = options.filter ? (["logs", options.filter] as const) : (["logs"] as const);
    return this.transport.subscribe<LogsSubscriptionResult>(
      { params, onData: options.onData, onError: options.onError },
      requestOptions,
    );
  }

  ethSubscribeNewHeads(
    handlers: SubscriptionHandlers<NewHeadsSubscriptionResult>,
    requestOptions?: RequestOptions,
  ): Promise<RpcSubscription> {
    return this.transport.subscribe<NewHeadsSubscriptionResult>(
      { params: ["newHeads"], ...handlers },
      requestOptions,
    );
  }

  ethSubscribeNewPendingTransactions<const full extends boolean = false>(
    options: PendingTransactionsSubscriptionOptions<full>,
    requestOptions?: RequestOptions,
  ): Promise<RpcSubscription> {
    const params =
      options.fullTransactions === undefined
        ? (["newPendingTransactions"] as const)
        : (["newPendingTransactions", options.fullTransactions] as const);
    return this.transport.subscribe<PendingTransactionSubscriptionResult<full>>(
      { params, onData: options.onData, onError: options.onError },
      requestOptions,
    );
  }

  ethSubscribeSyncing(
    handlers: SubscriptionHandlers<SyncingSubscriptionResult>,
    requestOptions?: RequestOptions,
  ): Promise<RpcSubscription> {
    return this.transport.subscribe<SyncingSubscriptionResult>(
      { params: ["syncing"], ...handlers },
      requestOptions,
    );
  }
}

export function createWebSocketClient(options: WebSocketTransportOptions): WebSocketClient {
  return new WebSocketClient(options);
}
