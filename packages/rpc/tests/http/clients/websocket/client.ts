import { WebSocketHeartbeat, type WebSocketHeartbeatOptions } from "./heartbeat.js";
import { WebSocketTransport, type WebSocketTransportParameters } from "./transport.js";
import { SubscriptionRegistry } from "./subscriptions.js";
import {
    buildSubscribeRequest,
    buildUnsubscribeRequest,
    classifyMessage,
    parseFrame,
} from "./protocol.js";
import type {
    SubscriptionRecord,
    WebSocketSubscription,
    WebSocketSubscriptionHandlers,
} from "./types.js";
import { normalizeError } from "../utils.js";

// ===========================================================
// Types
// ===========================================================

export type WebSocketClientOptions = {
    /** The URL for the WebSocket */
    url: WebSocketTransportParameters["url"];
    /** Heartbeat options */
    heartbeat: {
        /** The RPC method to use as ping */
        method: WebSocketHeartbeatOptions["method"];
        /** Time (ms) of inactivity before ping is sent */
        idleTimeoutMs: WebSocketHeartbeatOptions["idleTimeoutMs"];
        /** Time (ms) to wait for a pong response after ping is sent */
        pongTimeoutMs: WebSocketHeartbeatOptions["pongTimeoutMs"];
    };
    /** Reconnect options */
    reconnect: {
        /** Time (ms) to wait before reconnecting after a disconnect */
        delayMs: number;
    };
    /**
     * Time (ms) to wait for the `eth_subscribe` acknowledgement before treating the
     * connection as unhealthy and reconnecting. Must be a positive timer-safe integer.
     * @default 15_000
     */
    subscribeAckTimeoutMs?: number;
    /** Callback for any client-level error (transport, heartbeat, subscription). */
    onError?: (error: Error) => void;
    /** Callback for the log event */
    onLog?: (message: string) => void;
};

// ===========================================================
// Class
// ===========================================================

/**
 * A WebSocket client dedicated to EVM JSON-RPC subscriptions (`eth_subscribe`).
 *
 * It does one thing: keep a set of subscriptions alive. Register subscriptions
 * with {@link subscribe}; the client (re)issues every `eth_subscribe` on each
 * connect, routes `eth_subscription` notifications back to the right handler,
 * and — via the heartbeat + reconnect loop — automatically re-creates every
 * subscription whenever the socket drops for any reason other than {@link stop}.
 */
export class WebSocketClient {
    /** Default `eth_subscribe` acknowledgement timeout. */
    private static readonly DEFAULT_SUBSCRIBE_ACK_TIMEOUT_MS = 15_000;

    /** The WebSocket transport */
    private readonly _transport: WebSocketTransport;
    /** The WebSocket heartbeat */
    private readonly _heartbeat: WebSocketHeartbeat;
    /** Registered subscriptions and their per-connection bookkeeping. */
    private readonly _subscriptions = new SubscriptionRegistry();
    /** Resolved `eth_subscribe` ack timeout. */
    private readonly _subscribeAckTimeoutMs: number;
    /** The timer for the reconnect */
    private _reconnectTimer: NodeJS.Timeout | null = null;
    /** Whether the client was explicitly stopped by the user. */
    private _stopped = true;
    /** Whether the socket is currently open (safe to send). */
    private _connected = false;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly _options: WebSocketClientOptions
    ) {
        if (!Number.isSafeInteger(_options.reconnect.delayMs) || _options.reconnect.delayMs <= 0) {
            throw new Error("Please provide a valid reconnect delay in milliseconds (a positive timer-safe integer)");
        }

        const ackTimeout = _options.subscribeAckTimeoutMs ?? WebSocketClient.DEFAULT_SUBSCRIBE_ACK_TIMEOUT_MS;
        if (!Number.isSafeInteger(ackTimeout) || ackTimeout <= 0) {
            throw new Error("Please provide a valid subscribe ack timeout in milliseconds (a positive timer-safe integer)");
        }
        this._subscribeAckTimeoutMs = ackTimeout;

        this._transport = new WebSocketTransport({
            url: _options.url,
            onOpen: () => this._onOpen(),
            onMessage: (event) => this._onMessage(event),
            onClose: () => this._onClose(),
            onError: (error) => this._onError(error),
            onLog: (message: string) => this._log(`[transport] ${message}`),
        });

        this._heartbeat = new WebSocketHeartbeat({
            method: _options.heartbeat.method,
            idleTimeoutMs: _options.heartbeat.idleTimeoutMs,
            pongTimeoutMs: _options.heartbeat.pongTimeoutMs,
            send: (payload: string) => this._transport.send(payload),
            onFailure: (err: Error) => this._onHeartbeatFailure(err),
            onLog: (message: string) => this._log(`[heartbeat] ${message}`),
        });
    }

    // ==========================
    // Public API
    // ==========================

    /** Open the connection and (re)establish every registered subscription. */
    public start(): void {
        this._stopped = false;
        this._clearReconnectTimer();
        this._transport.create();
    }

    /** Close the connection. Registered subscriptions are kept so a later {@link start} restores them. */
    public stop(): void {
        this._stopped = true;
        this._connected = false;
        this._clearReconnectTimer();
        this._heartbeat.stop();
        this._subscriptions.resetConnectionState();
        this._transport.destroy();
    }

    /**
     * Register an `eth_subscribe` subscription.
     *
     * The subscription is sent immediately when connected, otherwise it is sent on
     * the next connect. Either way it is automatically re-created after every
     * reconnect until {@link WebSocketSubscription.unsubscribe} (or {@link stop}).
     *
     * @param params - `eth_subscribe` params, e.g. `["newHeads"]` or `["logs", filter]`.
     * @param handlers - Notification and lifecycle callbacks.
     */
    public subscribe<TResult = unknown>(
        params: unknown[],
        handlers: WebSocketSubscriptionHandlers<TResult>,
    ): WebSocketSubscription {
        const record = this._subscriptions.add(params, handlers as WebSocketSubscriptionHandlers);

        if (this._connected) {
            this._sendSubscribe(record);
        }

        return {
            id: record.localId,
            params,
            unsubscribe: () => this._unsubscribe(record.localId),
        };
    }

    // ==========================
    // Private — transport events
    // ==========================

    /** Handle the open event: start heartbeat and (re)subscribe everything. */
    private _onOpen(): void {
        this._connected = true;

        try {
            this._heartbeat.start();
            for (const record of this._subscriptions.all()) {
                this._sendSubscribe(record);
            }
        } catch (error) {
            const err = normalizeError(error, "Unhandled error during open handling");
            this._reportError(`[client] open handling failed: ${err.message}`, err);
            this._restartTransport("on_open_failure");
        }
    }

    /** Handle an inbound frame: heartbeat pong, subscribe ack, or subscription notification. */
    private _onMessage(event: MessageEvent): void {
        const raw = event.data as string;

        if (this._heartbeat.isPingResponse(raw)) {
            this._heartbeat.handlePingResponse(raw);
            return;
        }

        // Any non-ping traffic counts as liveness.
        this._heartbeat.reset();

        const parsed = parseFrame(raw);
        if (!parsed.ok) {
            this._reportError(`[client] invalid JSON frame: ${parsed.error.message}`);
            return;
        }

        this._dispatch(parsed.value);
    }

    /** Handle the close event: stop heartbeat and reconnect (unless explicitly stopped). */
    private _onClose(): void {
        this._connected = false;
        this._heartbeat.stop();
        this._subscriptions.resetConnectionState();
        this._scheduleReconnect();
    }

    /** Handle a transport error: report and restart the connection. */
    private _onError(err: Error): void {
        this._reportError(`[transport] error: ${err.message}`, err);
        if (this._stopped) return;
        this._restartTransport("transport_error");
    }

    /** Handle heartbeat failure: the connection is dead, restart it. */
    private _onHeartbeatFailure(err: Error): void {
        this._reportError(`[heartbeat] failure: ${err.message}`, err);
        this._restartTransport("heartbeat_failure");
    }

    // ==========================
    // Private — subscription protocol
    // ==========================

    /** Route a parsed frame to the matching subscription action. */
    private _dispatch(message: unknown): void {
        const classified = classifyMessage(message);

        switch (classified.kind) {
            case "ack": {
                const record = this._subscriptions.findByRequestId(classified.id);
                if (record) this._onSubscribeAck(record, classified.subscriptionId);
                return;
            }
            case "error": {
                const record = this._subscriptions.findByRequestId(classified.id);
                if (record) {
                    const reason = `eth_subscribe rejected (${classified.code ?? "?"}: ${classified.message})`;
                    this._onSubscribeError(record, new Error(reason));
                }
                return;
            }
            case "notification": {
                const record = this._subscriptions.findByNodeId(classified.subscriptionId);
                if (record) this._deliver(record, classified.result);
                return;
            }
            case "unknown":
                // e.g. eth_unsubscribe acks or frames we don't act on.
                return;
        }
    }

    /** Send (or re-send) the `eth_subscribe` for a record and arm its ack timer. */
    private _sendSubscribe(record: SubscriptionRecord): void {
        const requestId = this._subscriptions.markPending(record);

        try {
            this._transport.send(JSON.stringify(buildSubscribeRequest(requestId, record.params)));
        } catch (error) {
            this._reportSubscriptionError(record, normalizeError(error, "failed to send eth_subscribe"));
            this._restartTransport("subscribe_send_failure");
            return;
        }

        this._subscriptions.setAckTimer(
            record,
            setTimeout(() => {
                this._reportSubscriptionError(
                    record,
                    new Error(`eth_subscribe ack timeout after ${this._subscribeAckTimeoutMs}ms`),
                );
                // A missing ack means the socket is unhealthy — reconnect re-subscribes all.
                this._restartTransport("subscribe_ack_timeout");
            }, this._subscribeAckTimeoutMs),
        );
    }

    /** A subscription was confirmed by the node. */
    private _onSubscribeAck(record: SubscriptionRecord, nodeId: string): void {
        this._subscriptions.markActive(record, nodeId);
        this._log(`[client] subscription ${record.localId} active (node id: ${nodeId})`);

        try {
            record.handlers.onSubscribed?.(nodeId);
        } catch (error) {
            this._reportError(
                `[client] onSubscribed callback failed: ${normalizeError(error, "onSubscribed failed").message}`,
            );
        }
    }

    /** A subscription was rejected by the node — reconnect so it is retried cleanly. */
    private _onSubscribeError(record: SubscriptionRecord, error: Error): void {
        this._subscriptions.clearAckTimer(record);
        record.requestId = null;
        record.nodeId = null;
        this._reportSubscriptionError(record, error);
        this._restartTransport("subscribe_rejected");
    }

    /** Deliver a notification payload to a subscription's handler. */
    private _deliver(record: SubscriptionRecord, result: unknown): void {
        try {
            record.handlers.onData(result);
        } catch (error) {
            this._reportSubscriptionError(record, normalizeError(error, "onData callback failed"));
        }
    }

    /** Stop and forget a subscription, sending a best-effort `eth_unsubscribe`. */
    private _unsubscribe(localId: number): void {
        const record = this._subscriptions.remove(localId);
        if (!record) return;

        if (this._connected && record.nodeId) {
            try {
                this._transport.send(
                    JSON.stringify(buildUnsubscribeRequest(this._subscriptions.nextRequestId(), record.nodeId)),
                );
            } catch {
                // Best effort: the node drops the subscription when the socket closes anyway.
            }
        }
    }

    // ==========================
    // Private — reconnect
    // ==========================

    /** Schedule a reconnect (idempotent; respects an explicit stop). */
    private _scheduleReconnect(): void {
        if (this._stopped || this._reconnectTimer) return;

        const reconnectDelayMs = this._options.reconnect.delayMs;
        this._log(`[client] reconnecting in ${reconnectDelayMs}ms`);

        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            if (this._stopped) return;
            try {
                this._transport.create();
            } catch (error) {
                const err = normalizeError(error, "reconnect create() failed");
                this._reportError(`[client] reconnect failed: ${err.message}`, err);
                this._scheduleReconnect(); // keep trying, never give up
            }
        }, reconnectDelayMs);
    }

    /** Clear the reconnect timer */
    private _clearReconnectTimer(): void {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
    }

    /** Restart the transport from a known-clean state before reconnecting */
    private _restartTransport(reason: string): void {
        if (this._stopped) return;

        this._connected = false;
        this._heartbeat.stop();
        this._subscriptions.resetConnectionState();
        this._transport.destroy(4000, reason);
        this._scheduleReconnect();
    }

    // ==========================
    // Private — diagnostics
    // ==========================

    /** Report a subscription-scoped error to both its handler and the global error sink. */
    private _reportSubscriptionError(record: SubscriptionRecord, error: Error): void {
        try {
            record.handlers.onError?.(error);
        } catch {
            // A handler must never break the client.
        }
        this._reportError(`[client] subscription ${record.localId} error: ${error.message}`);
    }

    /** Call the log callback without letting it crash the client */
    private _log(message: string): void {
        try {
            this._options.onLog?.(message);
        } catch {
            // Logging must never break the websocket client.
        }
    }

    /** Report errors without letting the error callback crash the client */
    private _reportError(message: string, error?: Error): void {
        try {
            this._options.onError?.(error ?? new Error(message));
        } catch (callbackError) {
            const err = normalizeError(callbackError, "Unhandled error during onError callback");
            this._log(`[client] onError callback failed: ${err.message}`);
        }
    }
}
