import { TransportErrors } from "./errors.js";
import type {
    WebSocketCloseInfo,
    WebSocketFactory,
    WebSocketLike,
} from "./types.js";
import {
    getWebSocketUrl,
    type WsUrl,
    type WssUrl,
} from "./utils/url.js";

// ===========================================================
// Types
// ===========================================================

export type TransportParameters = {
    readonly url: string | WsUrl | WssUrl;
    readonly reconnect?: {
        readonly delayMs?: number;
    };
    readonly createWebSocket?: WebSocketFactory;
    readonly onOpen?: () => void;
    readonly onClose?: (info: WebSocketCloseInfo) => void;
    readonly onReconnect?: () => void;
    readonly onMessage?: (raw: string) => void;
    readonly onError?: (error: Error) => void;
    readonly onLog?: (message: string) => void;
};

export type WebSocketTransportOptions = TransportParameters;
export type WebSocketUrl = WsUrl | WssUrl;

type OpenWaiter = {
    readonly resolve: () => void;
    readonly reject: (error: Error) => void;
};

type WebSocketHandle = {
    readonly socket: WebSocketLike;
    readonly reconnect: boolean;
    readonly listeners: {
        readonly open: (event: Event) => void;
        readonly message: (event: MessageEvent) => void;
        readonly close: (event: CloseEvent) => void;
        readonly error: (event: Event) => void;
    };
};

// ===========================================================
// Constants
// ===========================================================

const CONNECTING = 0;
const OPEN = 1;

// ===========================================================
// Classes
// ===========================================================

export class WebSocketTransport {
    private readonly _url: WsUrl | WssUrl;
    private readonly _reconnectDelayMs: number;
    private readonly _createWebSocket: WebSocketFactory;
    private readonly _openWaiters = new Set<OpenWaiter>();
    private _handle: WebSocketHandle | null = null;
    private _reconnectTimer: NodeJS.Timeout | null = null;
    private _running = false;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly _parameters: TransportParameters,
    ) {
        this._url = getWebSocketUrl(_parameters.url);
        this._reconnectDelayMs = _parameters.reconnect?.delayMs ?? 2_000;

        if (
            !Number.isSafeInteger(this._reconnectDelayMs) ||
            this._reconnectDelayMs < 0
        ) {
            throw new Error(
                "WebSocket reconnect delay must be a non-negative safe integer",
            );
        }

        this._createWebSocket =
            _parameters.createWebSocket ??
            ((url) => new WebSocket(url) as unknown as WebSocketLike);
    }

    // ==========================
    // Public API
    // ==========================

    public start(): Promise<void> {
        if (this.isOpen()) {
            this._running = true;
            return Promise.resolve();
        }

        this._running = true;
        const opened = this._waitForOpen();
        if (!this._handle && !this._reconnectTimer) {
            this._createConnection(false);
        }
        return opened;
    }

    public stop(): void {
        if (!this._running && !this._handle && !this._reconnectTimer) {
            return;
        }

        this._running = false;
        this._clearReconnectTimer();
        this._rejectOpenWaiters(
            TransportErrors.connection({
                message: "WebSocket transport stopped",
            }),
        );
        this._closeCurrent(1000, "client_stop", true);
        this._log("stopped");
    }

    public restart(): Promise<void> {
        this._running = true;
        this._clearReconnectTimer();
        const opened = this._waitForOpen();

        this._closeCurrent(4000, "client_restart", true);
        this._createConnection(true);

        return opened;
    }

    public send(raw: string): void {
        const socket = this._handle?.socket;
        if (!socket || socket.readyState !== OPEN) {
            throw TransportErrors.connection({
                message: "WebSocket is not open",
            });
        }

        try {
            socket.send(raw);
        } catch (cause) {
            throw TransportErrors.connection({
                message: "Failed to send WebSocket message",
                cause,
            });
        }
    }

    public isOpen(): boolean {
        return this._handle?.socket.readyState === OPEN;
    }

    public isRunning(): boolean {
        return this._running;
    }

    // ==========================
    // Private Methods
    // ==========================

    private _createConnection(reconnect: boolean): void {
        if (!this._running) {
            return;
        }

        let socket: WebSocketLike;
        try {
            socket = this._createWebSocket(this._url);
        } catch (cause) {
            this._reportError(
                TransportErrors.connection({
                    message: "Failed to create WebSocket",
                    cause,
                }),
            );
            this._scheduleReconnect();
            return;
        }

        const listeners: WebSocketHandle["listeners"] = {
            open: () => {
                if (this._handle?.socket !== socket || !this._running) {
                    return;
                }

                this._clearReconnectTimer();
                this._log(reconnect ? "reconnected" : "connected");
                this._safeCallback(() => this._parameters.onOpen?.());
                if (reconnect) {
                    this._safeCallback(() => this._parameters.onReconnect?.());
                }
                this._resolveOpenWaiters();
            },
            message: (event) => {
                if (this._handle?.socket !== socket || !this._running) {
                    return;
                }
                if (typeof event.data !== "string") {
                    this._reportError(
                        TransportErrors.connection({
                            message: "Expected a string WebSocket message",
                        }),
                    );
                    return;
                }
                this._safeCallback(() => this._parameters.onMessage?.(event.data));
            },
            close: (event) => {
                if (this._handle?.socket !== socket) {
                    return;
                }

                this._removeListeners(socket, listeners);
                this._handle = null;
                this._emitClose({
                    code: event.code,
                    reason: event.reason || "socket_closed",
                    wasClean: event.wasClean,
                });
                this._scheduleReconnect();
            },
            error: (event) => {
                if (this._handle?.socket !== socket) {
                    return;
                }

                this._reportError(
                    TransportErrors.connection({
                        message: "WebSocket connection error",
                        cause: this._eventCause(event),
                    }),
                );
                this._removeListeners(socket, listeners);
                this._handle = null;
                this._closeSocket(socket, 4001, "socket_error");
                this._emitClose({
                    code: 1006,
                    reason: "socket_error",
                    wasClean: false,
                });
                this._scheduleReconnect();
            },
        };

        socket.addEventListener("open", listeners.open);
        socket.addEventListener("message", listeners.message);
        socket.addEventListener("close", listeners.close);
        socket.addEventListener("error", listeners.error);

        const previous = this._handle;
        this._handle = { socket, reconnect, listeners };
        if (previous) {
            this._destroyHandle(previous, 4000, "socket_replaced");
        }
        this._log(reconnect ? "created reconnect socket" : "created socket");

        if (socket.readyState === OPEN) {
            listeners.open(new Event("open"));
        }
    }

    private _scheduleReconnect(): void {
        if (!this._running || this._reconnectTimer) {
            return;
        }

        this._log(`reconnecting in ${this._reconnectDelayMs}ms`);
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            if (this._running) {
                this._createConnection(true);
            }
        }, this._reconnectDelayMs);
    }

    private _clearReconnectTimer(): void {
        if (!this._reconnectTimer) {
            return;
        }
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = null;
    }

    private _closeCurrent(
        code: number,
        reason: string,
        emitClose: boolean,
    ): void {
        const handle = this._handle;
        if (!handle) {
            return;
        }

        this._handle = null;
        this._destroyHandle(handle, code, reason);
        if (emitClose) {
            this._emitClose({ code, reason, wasClean: true });
        }
    }

    private _destroyHandle(
        handle: WebSocketHandle,
        code: number,
        reason: string,
    ): void {
        this._removeListeners(handle.socket, handle.listeners);
        this._closeSocket(handle.socket, code, reason);
    }

    private _closeSocket(
        socket: WebSocketLike,
        code: number,
        reason: string,
    ): void {
        if (socket.readyState !== CONNECTING && socket.readyState !== OPEN) {
            return;
        }
        try {
            socket.close(code, reason);
        } catch (cause) {
            this._reportError(
                TransportErrors.connection({
                    message: "Failed to close WebSocket",
                    cause,
                }),
            );
        }
    }

    private _removeListeners(
        socket: WebSocketLike,
        listeners: WebSocketHandle["listeners"],
    ): void {
        socket.removeEventListener("open", listeners.open);
        socket.removeEventListener("message", listeners.message);
        socket.removeEventListener("close", listeners.close);
        socket.removeEventListener("error", listeners.error);
    }

    private _waitForOpen(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._openWaiters.add({ resolve, reject });
        });
    }

    private _resolveOpenWaiters(): void {
        for (const waiter of this._openWaiters) {
            waiter.resolve();
        }
        this._openWaiters.clear();
    }

    private _rejectOpenWaiters(error: Error): void {
        for (const waiter of this._openWaiters) {
            waiter.reject(error);
        }
        this._openWaiters.clear();
    }

    private _emitClose(info: WebSocketCloseInfo): void {
        this._log(`closed (${info.code}: ${info.reason})`);
        this._safeCallback(() => this._parameters.onClose?.(info));
    }

    private _eventCause(event: Event): unknown {
        return (event as Event & { readonly error?: unknown }).error ?? event;
    }

    private _safeCallback(callback: () => void): void {
        try {
            callback();
        } catch (cause) {
            this._reportError(
                TransportErrors.connection({
                    message: "WebSocket lifecycle callback failed",
                    cause,
                }),
            );
        }
    }

    private _reportError(error: Error): void {
        try {
            this._parameters.onError?.(error);
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "unknown error";
            this._log(`onError callback failed: ${message}`);
        }
    }

    private _log(message: string): void {
        try {
            this._parameters.onLog?.(`[WebSocketTransport] ${message}`);
        } catch {
            // Logging must not affect the transport lifecycle.
        }
    }
}
