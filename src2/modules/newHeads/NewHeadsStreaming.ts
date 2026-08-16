import {
    RpcWebSocketClient,
    type RpcWebSocketClientOptions,
} from "../../clients/websocket/client.js";
import type { SubscriptionHandle } from "../../clients/websocket/types.js";
import type { RpcHead } from "./api/eth_subscribeNewHeads.js";

// ===========================================================
// Types
// ===========================================================

export type NewHeadsStreamingOptions = {
    readonly url: RpcWebSocketClientOptions["url"];
    readonly reconnect?: {
        readonly delayMs?: number;
    };
    readonly idleTimeoutMs?: number;
    readonly subscribeAckTimeoutMs?: number;
    readonly onHead: (head: RpcHead) => void;
    readonly onUnhealthy?: (reason: string) => void;
    readonly onError: (error: Error) => void;
    readonly onLog?: (message: string) => void;
};

// ===========================================================
// Classes
// ===========================================================

export class NewHeadsStreaming {
    private readonly _client: RpcWebSocketClient;
    private readonly _idleTimeoutMs: number;
    private readonly _subscribeAckTimeoutMs: number;
    private _subscription: SubscriptionHandle | null = null;
    private _idleTimer: NodeJS.Timeout | null = null;
    private _lastHead: RpcHead | null = null;
    private _lastHeadReceivedAt: number | null = null;
    private _running = false;
    private _healthy = false;
    private _unhealthyNotified = false;
    private _startPromise: Promise<void> | null = null;
    private _generation = 0;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly _options: NewHeadsStreamingOptions,
    ) {
        this._idleTimeoutMs = this._getPositiveInteger(
            _options.idleTimeoutMs ?? 30_000,
            "New heads idle timeout",
        );
        this._subscribeAckTimeoutMs = this._getPositiveInteger(
            _options.subscribeAckTimeoutMs ?? 15_000,
            "New heads subscribe acknowledgement timeout",
        );

        this._client = new RpcWebSocketClient({
            url: _options.url,
            reconnect: _options.reconnect,
            onError: (error) => this._handleClientError(error),
            onLog: (message) => this._log(message),
        });
    }

    // ==========================
    // Public API
    // ==========================

    public start(): Promise<void> {
        if (this._startPromise) {
            return this._startPromise;
        }
        if (this._running && this._subscription) {
            return Promise.resolve();
        }

        this._running = true;
        this._healthy = false;
        this._unhealthyNotified = false;
        const generation = ++this._generation;
        this._startPromise = this._start(generation).finally(() => {
            this._startPromise = null;
        });
        return this._startPromise;
    }

    public async stop(): Promise<void> {
        if (!this._running && !this._subscription) {
            this._client.stop();
            return;
        }

        this._running = false;
        this._generation++;
        this._healthy = false;
        this._unhealthyNotified = false;
        this._clearIdleTimer();

        const subscription = this._subscription;
        this._subscription = null;
        if (subscription) {
            try {
                await subscription.unsubscribe();
            } catch (cause) {
                this._reportError(this._toError(cause, "Failed to unsubscribe new heads"));
            }
        }
        this._client.stop();
        this._log("stopped");
    }

    public async restart(): Promise<void> {
        if (!this._running) {
            await this.start();
            return;
        }

        this._healthy = false;
        this._unhealthyNotified = false;
        this._clearIdleTimer();
        await this._client.restart();

        if (this._running) {
            this._resetIdleTimer();
            this._log("restarted");
        }
    }

    public isRunning(): boolean {
        return this._running;
    }

    public isHealthy(): boolean {
        return this._healthy;
    }

    public getLastHead(): RpcHead | null {
        return this._lastHead;
    }

    public getLastHeadReceivedAt(): number | null {
        return this._lastHeadReceivedAt;
    }

    // ==========================
    // Private Methods
    // ==========================

    private async _start(generation: number): Promise<void> {
        try {
            await this._client.start();
            if (!this._running || generation !== this._generation) {
                return;
            }

            const subscription = await this._client.subscribe<RpcHead>(
                ["newHeads"],
                (head) => this._handleHead(head),
                {
                    resubscribeOnReconnect: true,
                    ackTimeoutMs: this._subscribeAckTimeoutMs,
                },
            );
            if (!this._running || generation !== this._generation) {
                await subscription.unsubscribe();
                return;
            }
            this._subscription = subscription;
            this._resetIdleTimer();
            this._log("subscribed to newHeads");
        } catch (cause) {
            if (!this._running || generation !== this._generation) {
                return;
            }
            const error = this._toError(cause, "Failed to start new heads streaming");
            this._markUnhealthy(error.message);
            this._reportError(error);
            throw error;
        }
    }

    private _handleHead(value: unknown): void {
        if (!this._running) {
            return;
        }

        let head: RpcHead;
        try {
            head = this._normalizeHead(value);
        } catch (cause) {
            this._reportError(this._toError(cause, "Invalid newHeads payload"));
            return;
        }

        this._lastHead = head;
        this._lastHeadReceivedAt = Date.now();
        this._healthy = true;
        this._unhealthyNotified = false;
        this._resetIdleTimer();

        try {
            this._options.onHead(head);
        } catch (cause) {
            this._reportError(this._toError(cause, "New heads callback failed"));
        }
    }

    private _handleClientError(error: Error): void {
        if (this._running) {
            this._markUnhealthy(error.message);
        }
        this._reportError(error);
    }

    private _resetIdleTimer(): void {
        this._clearIdleTimer();
        if (!this._running) {
            return;
        }

        this._idleTimer = setTimeout(() => {
            this._idleTimer = null;
            const reason = `No new head received for ${this._idleTimeoutMs}ms`;
            this._markUnhealthy(reason);
            this._reportError(new Error(reason));
        }, this._idleTimeoutMs);
    }

    private _clearIdleTimer(): void {
        if (!this._idleTimer) {
            return;
        }
        clearTimeout(this._idleTimer);
        this._idleTimer = null;
    }

    private _markUnhealthy(reason: string): void {
        this._healthy = false;
        this._clearIdleTimer();
        if (this._unhealthyNotified) {
            return;
        }

        this._unhealthyNotified = true;
        try {
            this._options.onUnhealthy?.(reason);
        } catch (cause) {
            this._reportError(this._toError(cause, "Unhealthy callback failed"));
        }
    }

    private _normalizeHead(value: unknown): RpcHead {
        if (!this._isRecord(value)) {
            throw new Error("newHeads payload must be an object");
        }
        if (
            (value["number"] !== null && !this._isHex(value["number"])) ||
            (value["hash"] !== null && !this._isHex(value["hash"])) ||
            !this._isHex(value["parentHash"]) ||
            !this._isHex(value["timestamp"])
        ) {
            throw new Error("newHeads payload is missing required header fields");
        }
        return value as RpcHead;
    }

    private _isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    private _isHex(value: unknown): value is `0x${string}` {
        return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
    }

    private _getPositiveInteger(value: number, name: string): number {
        if (!Number.isSafeInteger(value) || value <= 0) {
            throw new Error(`${name} must be a positive safe integer`);
        }
        return value;
    }

    private _toError(cause: unknown, fallback: string): Error {
        if (cause instanceof Error) {
            return cause;
        }
        if (typeof cause === "string") {
            return new Error(cause);
        }
        return new Error(fallback, { cause });
    }

    private _reportError(error: Error): void {
        try {
            this._options.onError(error);
        } catch (cause) {
            this._log(`onError callback failed: ${this._toError(cause, "unknown error").message}`);
        }
    }

    private _log(message: string): void {
        try {
            this._options.onLog?.(`[NewHeadsStreaming] ${message}`);
        } catch {
            // Logging must not affect the stream lifecycle.
        }
    }
}
