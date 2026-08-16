import {
    RequestErrors,
    ResponseErrors,
    SubscriptionErrors,
    TransportErrors,
} from "./errors.js";
import {
    WebSocketTransport,
    type TransportParameters,
} from "./transport.js";
import type {
    JsonRpcRequest,
    SubscriptionHandle,
    WebSocketFactory,
} from "./types.js";
import { isJsonRpcErrorObject, isRecord, parseWebSocketMessage } from "./utils/response.js";
import { getTimeout } from "./utils/timeout.js";
import type { WsUrl, WssUrl } from "./utils/url.js";

// ===========================================================
// Types
// ===========================================================

export type RequestOptions = {
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
};

export type SubscriptionOptions = {
    readonly resubscribeOnReconnect?: boolean;
    readonly ackTimeoutMs?: number;
};

export type RpcWebSocketClientOptions = {
    readonly url: string | WsUrl | WssUrl;
    readonly reconnect?: TransportParameters["reconnect"];
    readonly requestTimeoutMs?: number;
    readonly createWebSocket?: WebSocketFactory;
    readonly onError?: (error: Error) => void;
    readonly onLog?: (message: string) => void;
};

export type WebSocketClientOptions = RpcWebSocketClientOptions;
export type RpcRequestOptions = RequestOptions;
export type RpcSubscriptionOptions = SubscriptionOptions;

type PendingRequest = {
    readonly method: string;
    readonly resolve: (result: unknown) => void;
    readonly reject: (error: Error) => void;
    dispose(): void;
};

type SubscriptionIntent = {
    readonly params: readonly unknown[];
    readonly onData: (data: unknown) => void;
    readonly options: Required<SubscriptionOptions>;
    resubscribeEligible: boolean;
};

// ===========================================================
// Classes
// ===========================================================

export class RpcWebSocketClient {
    private readonly _transport: WebSocketTransport;
    private readonly _requestTimeoutMs: number;
    private readonly _pendingRequests = new Map<number, PendingRequest>();
    private _nextRequestId = 1;
    private _subscriptionId: string | null = null;
    private _subscriptionIntent: SubscriptionIntent | null = null;
    private _subscribing = false;
    private _resubscribePromise: Promise<void> | null = null;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly _options: RpcWebSocketClientOptions,
    ) {
        this._requestTimeoutMs = getTimeout(
            _options.requestTimeoutMs ?? 10_000,
        );

        this._transport = new WebSocketTransport({
            url: _options.url,
            reconnect: _options.reconnect,
            createWebSocket: _options.createWebSocket,
            onClose: () => this._handleDisconnect(),
            onReconnect: () => this._handleReconnect(),
            onMessage: (raw) => this._handleMessage(raw),
            onError: (error) => this._reportError(error),
            onLog: (message) => this._log(message),
        });
    }

    // ==========================
    // Public API
    // ==========================

    public start(): Promise<void> {
        return this._transport.start();
    }

    public stop(): void {
        this._subscriptionIntent = null;
        this._subscriptionId = null;
        this._subscribing = false;
        this._rejectPendingRequests(
            TransportErrors.connection({
                message: "WebSocket RPC client stopped",
            }),
        );
        this._transport.stop();
    }

    public async restart(): Promise<void> {
        await this._transport.restart();
        if (this._resubscribePromise) {
            await this._resubscribePromise;
        }
    }

    public request<T>(
        method: string,
        params?: readonly unknown[],
        options: RequestOptions = {},
    ): Promise<T> {
        if (!method) {
            return Promise.reject(
                ResponseErrors.invalid({ response: { method } }),
            );
        }
        if (!this._transport.isOpen()) {
            return Promise.reject(
                TransportErrors.connection({
                    message: "WebSocket is not open",
                }),
            );
        }
        if (options.signal?.aborted) {
            return Promise.reject(
                RequestErrors.abort({ cause: options.signal.reason }),
            );
        }

        const timeoutMs = getTimeout(
            options.timeoutMs ?? this._requestTimeoutMs,
        );
        const id = this._takeRequestId();
        const request: JsonRpcRequest = {
            id,
            jsonrpc: "2.0",
            method,
            ...(params === undefined ? {} : { params }),
        };

        let raw: string;
        try {
            raw = JSON.stringify(request);
        } catch (cause) {
            return Promise.reject(RequestErrors.serialization({ cause }));
        }

        return new Promise<T>((resolve, reject) => {
            const onAbort = () => {
                const pending = this._pendingRequests.get(id);
                if (!pending) {
                    return;
                }
                this._pendingRequests.delete(id);
                pending.dispose();
                reject(RequestErrors.abort({ cause: options.signal?.reason }));
            };
            const timer = setTimeout(() => {
                const pending = this._pendingRequests.get(id);
                if (!pending) {
                    return;
                }
                this._pendingRequests.delete(id);
                pending.dispose();
                reject(RequestErrors.timeout({ timeout: timeoutMs, method }));
            }, timeoutMs);
            const dispose = () => {
                clearTimeout(timer);
                options.signal?.removeEventListener("abort", onAbort);
            };

            this._pendingRequests.set(id, {
                method,
                resolve: (result) => resolve(result as T),
                reject,
                dispose,
            });
            options.signal?.addEventListener("abort", onAbort, { once: true });

            try {
                this._transport.send(raw);
            } catch (cause) {
                dispose();
                this._pendingRequests.delete(id);
                reject(
                    TransportErrors.connection({
                        message: `Failed to send ${method} request`,
                        cause,
                    }),
                );
            }
        });
    }

    public async subscribe<T>(
        params: readonly unknown[],
        onData: (data: T) => void,
        options: SubscriptionOptions = {},
    ): Promise<SubscriptionHandle> {
        if (this._subscriptionIntent || this._subscribing) {
            throw SubscriptionErrors.subscribe({
                message: "This WebSocket RPC client already has a subscription",
            });
        }
        if (typeof params[0] !== "string" || params[0].length === 0) {
            throw SubscriptionErrors.subscribe({
                message: "eth_subscribe params must begin with a subscription name",
            });
        }

        const intent: SubscriptionIntent = {
            params: [...params],
            onData: onData as (data: unknown) => void,
            options: {
                resubscribeOnReconnect: options.resubscribeOnReconnect ?? false,
                ackTimeoutMs: getTimeout(
                    options.ackTimeoutMs ?? this._requestTimeoutMs,
                ),
            },
            resubscribeEligible: false,
        };
        this._subscriptionIntent = intent;
        this._subscribing = true;

        try {
            const subscriptionId = await this.request<unknown>(
                "eth_subscribe",
                intent.params,
                { timeoutMs: intent.options.ackTimeoutMs },
            );
            if (typeof subscriptionId !== "string" || subscriptionId.length === 0) {
                throw SubscriptionErrors.subscribe({
                    message: "eth_subscribe returned an invalid subscription id",
                });
            }
            if (this._subscriptionIntent !== intent) {
                throw SubscriptionErrors.subscribe({
                    message: "Subscription was cancelled before acknowledgement",
                });
            }

            this._subscriptionId = subscriptionId;
            intent.resubscribeEligible = true;
            this._log(`subscribed (${subscriptionId})`);

            return {
                getSubscriptionId: () => this.getSubscriptionId(),
                unsubscribe: () => this.unsubscribe(),
            };
        } catch (cause) {
            if (this._subscriptionIntent === intent) {
                this._subscriptionIntent = null;
                this._subscriptionId = null;
            }
            if (cause instanceof Error) {
                throw cause;
            }
            throw SubscriptionErrors.subscribe({
                message: "Failed to subscribe",
                cause,
            });
        } finally {
            this._subscribing = false;
        }
    }

    public async unsubscribe(): Promise<void> {
        const subscriptionId = this._subscriptionId;
        this._subscriptionIntent = null;
        this._subscriptionId = null;
        this._subscribing = false;

        if (!subscriptionId || !this._transport.isOpen()) {
            return;
        }

        let result: unknown;
        try {
            result = await this.request<unknown>(
                "eth_unsubscribe",
                [subscriptionId],
            );
        } catch (cause) {
            throw SubscriptionErrors.unsubscribe({
                message: "Failed to unsubscribe",
                cause,
            });
        }
        if (result !== true) {
            throw SubscriptionErrors.unsubscribe({
                message: "eth_unsubscribe returned false or an invalid result",
            });
        }
        this._log(`unsubscribed (${subscriptionId})`);
    }

    public isSubscribed(): boolean {
        return this._subscriptionId !== null;
    }

    public getSubscriptionId(): string | null {
        return this._subscriptionId;
    }

    // ==========================
    // Private Methods
    // ==========================

    private _handleMessage(raw: string): void {
        const parsed = parseWebSocketMessage(raw);
        if (!parsed.ok) {
            this._reportError(
                ResponseErrors.protocol({
                    message: "Invalid JSON WebSocket message",
                    raw,
                    cause: parsed.error,
                }),
            );
            return;
        }

        if (
            !isRecord(parsed.value) ||
            parsed.value["jsonrpc"] !== "2.0"
        ) {
            this._reportError(
                ResponseErrors.invalid({ response: parsed.value }),
            );
            return;
        }

        if (parsed.value["method"] === "eth_subscription") {
            this._handleSubscriptionNotification(parsed.value);
            return;
        }
        this._handleResponse(parsed.value);
    }

    private _handleResponse(message: Record<string, unknown>): void {
        const id = message["id"];
        if (typeof id !== "number" || !Number.isSafeInteger(id)) {
            this._reportError(ResponseErrors.invalid({ response: message }));
            return;
        }

        const pending = this._pendingRequests.get(id);
        if (!pending) {
            this._log(`ignored response for unknown request ${id}`);
            return;
        }

        this._pendingRequests.delete(id);
        pending.dispose();

        const hasResult = Object.hasOwn(message, "result");
        const hasError = Object.hasOwn(message, "error");
        if (hasResult === hasError) {
            pending.reject(ResponseErrors.invalid({ response: message }));
            return;
        }

        if (hasError) {
            const error = message["error"];
            if (!isJsonRpcErrorObject(error)) {
                pending.reject(ResponseErrors.invalid({ response: message }));
                return;
            }
            pending.reject(ResponseErrors.provider({ error }));
            return;
        }
        pending.resolve(message["result"]);
    }

    private _handleSubscriptionNotification(
        message: Record<string, unknown>,
    ): void {
        const params = message["params"];
        if (!isRecord(params)) {
            this._reportError(ResponseErrors.invalid({ response: message }));
            return;
        }

        const subscriptionId = params["subscription"];
        if (
            typeof subscriptionId !== "string" ||
            subscriptionId !== this._subscriptionId
        ) {
            this._log("ignored notification for an inactive subscription");
            return;
        }
        if (!Object.hasOwn(params, "result") || !this._subscriptionIntent) {
            this._reportError(ResponseErrors.invalid({ response: message }));
            return;
        }

        try {
            this._subscriptionIntent.onData(params["result"]);
        } catch (cause) {
            this._reportError(
                ResponseErrors.protocol({
                    message: "Subscription data callback failed",
                    cause,
                }),
            );
        }
    }

    private _handleDisconnect(): void {
        this._rejectPendingRequests(
            TransportErrors.connection({ message: "WebSocket disconnected" }),
        );
        this._subscribing = false;
        this._subscriptionId = null;

        if (
            !this._subscriptionIntent?.options.resubscribeOnReconnect ||
            !this._subscriptionIntent.resubscribeEligible
        ) {
            this._subscriptionIntent = null;
        }
    }

    private _handleReconnect(): void {
        this._rejectPendingRequests(
            TransportErrors.connection({ message: "WebSocket reconnected" }),
        );
        this._subscriptionId = null;

        const intent = this._subscriptionIntent;
        if (
            !intent ||
            !intent.options.resubscribeOnReconnect ||
            !intent.resubscribeEligible
        ) {
            return;
        }

        this._resubscribePromise = this._resubscribe(intent).finally(() => {
            this._resubscribePromise = null;
        });
    }

    private async _resubscribe(intent: SubscriptionIntent): Promise<void> {
        if (this._subscribing || this._subscriptionIntent !== intent) {
            return;
        }

        this._subscribing = true;
        try {
            const subscriptionId = await this.request<unknown>(
                "eth_subscribe",
                intent.params,
                { timeoutMs: intent.options.ackTimeoutMs },
            );
            if (typeof subscriptionId !== "string" || subscriptionId.length === 0) {
                throw SubscriptionErrors.subscribe({
                    message: "eth_subscribe returned an invalid subscription id",
                });
            }
            if (this._subscriptionIntent === intent) {
                this._subscriptionId = subscriptionId;
                this._log(`resubscribed (${subscriptionId})`);
            }
        } catch (cause) {
            this._subscriptionId = null;
            this._reportError(
                cause instanceof Error
                    ? cause
                    : SubscriptionErrors.subscribe({
                        message: "Failed to resubscribe",
                        cause,
                    }),
            );
        } finally {
            this._subscribing = false;
        }
    }

    private _rejectPendingRequests(error: Error): void {
        for (const pending of this._pendingRequests.values()) {
            pending.dispose();
            pending.reject(error);
        }
        this._pendingRequests.clear();
    }

    private _takeRequestId(): number {
        const id = this._nextRequestId;
        this._nextRequestId =
            id >= Number.MAX_SAFE_INTEGER ? 1 : id + 1;
        return id;
    }

    private _reportError(error: Error): void {
        try {
            this._options.onError?.(error);
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "unknown error";
            this._log(`onError callback failed: ${message}`);
        }
    }

    private _log(message: string): void {
        try {
            this._options.onLog?.(`[RpcWebSocketClient] ${message}`);
        } catch {
            // Logging must not affect the client lifecycle.
        }
    }
}

export { RpcWebSocketClient as WebSocketClient };
