import {
    NewHeadsPolling,
    type NewHeadsPollingOptions,
} from "./NewHeadsPolling.js";
import {
    NewHeadsStreaming,
    type NewHeadsStreamingOptions,
} from "./NewHeadsStreaming.js";
import type { RpcBlock } from "./api/eth_getBlockByNumber.js";
import type { RpcHead } from "./api/eth_subscribeNewHeads.js";
import {
    extractHeaderFromBlock,
    type BlockHeader,
} from "./utils/extractHeaderFromBlock.js";

// ===========================================================
// Types
// ===========================================================

export type BlockSource = "http" | "websocket";

export type BlockSourceManagerOptions = {
    readonly wsUrl: NewHeadsStreamingOptions["url"];
    readonly httpUrl: NewHeadsPollingOptions["url"];
    readonly reconnect?: NewHeadsStreamingOptions["reconnect"];
    readonly idleTimeoutMs?: number;
    readonly subscribeAckTimeoutMs?: number;
    readonly fallbackDelayMs: number;
    readonly wsRestartDelayMs: number;
    readonly pollingIntervalMs: number;
    readonly onHead: (header: BlockHeader, source: BlockSource) => void;
    readonly onError: (error: Error) => void;
    readonly onLog?: (message: string) => void;
};

// ===========================================================
// Classes
// ===========================================================

export class BlockSourceManager {
    private readonly _streaming: NewHeadsStreaming;
    private readonly _polling: NewHeadsPolling;
    private _fallbackTimer: NodeJS.Timeout | null = null;
    private _wsRestartTimer: NodeJS.Timeout | null = null;
    private _lastDeliveredHash: `0x${string}` | null = null;
    private _running = false;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly _options: BlockSourceManagerOptions,
    ) {
        this._validateDelay(_options.fallbackDelayMs, "Fallback delay");
        this._validateDelay(_options.wsRestartDelayMs, "WebSocket restart delay");
        this._validateDelay(_options.pollingIntervalMs, "Polling interval", false);

        this._streaming = new NewHeadsStreaming({
            url: _options.wsUrl,
            reconnect: _options.reconnect,
            idleTimeoutMs: _options.idleTimeoutMs,
            subscribeAckTimeoutMs: _options.subscribeAckTimeoutMs,
            onHead: (head) => this._handleWebSocketHead(head),
            onUnhealthy: (reason) => this._handleWebSocketUnhealthy(reason),
            onError: (error) => this._reportError(error),
            onLog: (message) => this._log(message),
        });

        this._polling = new NewHeadsPolling({
            url: _options.httpUrl,
            fetchIntervalMs: _options.pollingIntervalMs,
            onBlock: (block) => this._handleHttpBlock(block),
            onError: (error) => this._reportError(error),
            onLog: (message) => this._log(message),
        });
    }

    // ==========================
    // Public API
    // ==========================

    public async start(): Promise<void> {
        if (this._running) {
            return;
        }

        this._running = true;
        this._lastDeliveredHash = null;
        this._clearTimers();
        this._log("starting");

        try {
            await this._streaming.start();
        } catch (cause) {
            this._handleWebSocketUnhealthy(
                this._toError(cause, "Failed to start WebSocket source").message,
            );
        }
    }

    public async stop(): Promise<void> {
        if (!this._running) {
            return;
        }

        this._running = false;
        this._lastDeliveredHash = null;
        this._clearTimers();
        this._polling.stop();
        await this._streaming.stop();
        this._log("stopped");
    }

    public isRunning(): boolean {
        return this._running;
    }

    // ==========================
    // Private Methods
    // ==========================

    private _handleWebSocketHead(head: RpcHead): void {
        if (!this._running) {
            return;
        }

        this._clearFallbackTimer();
        this._clearWebSocketRestartTimer();
        this._polling.stop();
        this._emitHead(head, "websocket");
    }

    private _handleHttpBlock(block: RpcBlock): void {
        if (!this._running) {
            return;
        }
        this._emitHead(block, "http");
    }

    private _handleWebSocketUnhealthy(reason: string): void {
        if (!this._running) {
            return;
        }

        this._log(`WebSocket unhealthy: ${reason}`);
        this._scheduleFallback();
        this._scheduleWebSocketRestart();
    }

    private _scheduleFallback(): void {
        if (this._fallbackTimer || this._polling.isRunning) {
            return;
        }

        this._fallbackTimer = setTimeout(() => {
            this._fallbackTimer = null;
            if (this._running) {
                this._polling.start();
            }
        }, this._options.fallbackDelayMs);
    }

    private _scheduleWebSocketRestart(): void {
        if (this._wsRestartTimer) {
            return;
        }

        this._wsRestartTimer = setTimeout(() => {
            this._wsRestartTimer = null;
            if (!this._running) {
                return;
            }

            void this._streaming.restart().catch((cause) => {
                const error = this._toError(cause, "Failed to restart WebSocket source");
                this._reportError(error);
                this._handleWebSocketUnhealthy(error.message);
            });
        }, this._options.wsRestartDelayMs);
    }

    private _emitHead(block: RpcBlock | RpcHead, source: BlockSource): void {
        let header: BlockHeader;
        try {
            header = extractHeaderFromBlock(block);
        } catch (cause) {
            this._reportError(this._toError(cause, `Invalid ${source} block header`));
            return;
        }

        if (header.hash === this._lastDeliveredHash) {
            return;
        }
        this._lastDeliveredHash = header.hash;

        try {
            this._options.onHead(header, source);
        } catch (cause) {
            this._reportError(this._toError(cause, "Block source callback failed"));
        }
    }

    private _clearTimers(): void {
        this._clearFallbackTimer();
        this._clearWebSocketRestartTimer();
    }

    private _clearFallbackTimer(): void {
        if (!this._fallbackTimer) {
            return;
        }
        clearTimeout(this._fallbackTimer);
        this._fallbackTimer = null;
    }

    private _clearWebSocketRestartTimer(): void {
        if (!this._wsRestartTimer) {
            return;
        }
        clearTimeout(this._wsRestartTimer);
        this._wsRestartTimer = null;
    }

    private _validateDelay(value: number, name: string, allowZero = true): void {
        if (
            !Number.isSafeInteger(value) ||
            (allowZero ? value < 0 : value <= 0)
        ) {
            throw new Error(
                `${name} must be ${allowZero ? "a non-negative" : "a positive"} safe integer`,
            );
        }
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
            this._options.onLog?.(`[BlockSourceManager] ${message}`);
        } catch {
            // Logging must not affect the manager lifecycle.
        }
    }
}
