import { RpcSubscriptionError, RpcUnsubscribeError } from "../errors/index.js";
import type { JsonValue, RequestOptions } from "../types.js";
import { Subscriptions } from "./subscriptions.js";
import type { RpcSubscription, SubscribeOptions } from "./types.js";

type SubscribeRequest = (
  params: readonly JsonValue[],
  options?: RequestOptions,
) => Promise<unknown>;

type UnsubscribeRequest = (id: string, options?: RequestOptions) => Promise<boolean>;

export class SubscriptionManager {
  private readonly subscriptions = new Subscriptions();
  private readonly subscribeRequest: SubscribeRequest;
  private readonly unsubscribeRequest: UnsubscribeRequest;
  private readonly onError: (error: Error) => void;

  constructor(
    subscribeRequest: SubscribeRequest,
    unsubscribeRequest: UnsubscribeRequest,
    onError: (error: Error) => void,
  ) {
    this.subscribeRequest = subscribeRequest;
    this.unsubscribeRequest = unsubscribeRequest;
    this.onError = onError;
  }

  get size(): number {
    return this.subscriptions.size;
  }

  async subscribe<result>(
    options: SubscribeOptions<result>,
    requestOptions: RequestOptions = {},
  ): Promise<RpcSubscription> {
    const id = await this.subscribeRequest(options.params, requestOptions);
    if (typeof id !== "string") throw new RpcSubscriptionError("Invalid subscription id.", id);

    const record = this.subscriptions.add(options, id);
    return {
      get id() {
        return record.id;
      },
      unsubscribe: async (unsubscribeOptions) => {
        const currentId = record.id;
        this.subscriptions.remove(record);
        if (!currentId) return true;
        const unsubscribed = await this.unsubscribeRequest(currentId, unsubscribeOptions);
        if (!unsubscribed) {
          throw new RpcUnsubscribeError("eth_unsubscribe returned false.", unsubscribed);
        }
        return true;
      },
    };
  }

  handle(id: string, result: unknown): void {
    const record = this.subscriptions.get(id);
    if (!record) return;
    try {
      record.onData(result);
    } catch (error) {
      const normalized = normalizeError(error);
      record.onError?.(normalized);
      this.onError(normalized);
    }
  }

  get hasUnbound(): boolean {
    return this.subscriptions.hasUnbound();
  }

  disconnected(): void {
    this.subscriptions.unbindAll();
  }

  async restore(): Promise<void> {
    let firstError: Error | undefined;
    for (const record of this.subscriptions.values()) {
      if (record.id || !this.subscriptions.has(record)) continue;
      try {
        const id = await this.subscribeRequest(record.params);
        if (typeof id !== "string") throw new RpcSubscriptionError("Invalid subscription id.", id);
        // Unsubscribed or restored elsewhere while the request was in flight.
        if (!this.subscriptions.has(record) || record.id) {
          this.unsubscribeRequest(id).catch(() => undefined);
          continue;
        }
        this.subscriptions.bind(record, id);
      } catch (error) {
        const normalized = normalizeError(error);
        record.onError?.(normalized);
        firstError ??= normalized;
      }
    }
    if (firstError) throw firstError;
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
