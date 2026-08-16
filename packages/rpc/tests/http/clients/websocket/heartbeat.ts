// ===========================================================
// Types
// ===========================================================

export type WebSocketHeartbeatOptions = {
    /** The RPC method to use as ping */
    method: "net_version" | "eth_blockNumber";
    /** The idle timeout in milliseconds */
    idleTimeoutMs: number;
    /** The pong timeout in milliseconds */
    pongTimeoutMs: number;
    /** The function to send a message to the WebSocket */
    send: (payload: string) => void;
    /** The callback for the failure event */
    onFailure: (error: Error) => void;
    /** The callback for the log event (debug) */
    onLog?: (message: string) => void;
};

// ===========================================================
// Class
// ===========================================================

export class WebSocketHeartbeat {
    /** The ID for the ping */
    private readonly _pingId = "__ethereum_ws_idle_ping__";
    /** The timer for the idle ping */
    private _idleTimer: NodeJS.Timeout | null = null;
    /** The timer for the pong */
    private _pongTimer: NodeJS.Timeout | null = null;
    /** Whether we are waiting for a pong */
    private _waitingForPong = false;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly _options: WebSocketHeartbeatOptions,
    ) {
        if (this._options.idleTimeoutMs <= 1_000) {
            throw new Error("Idle timeout must be greater than 1 second");
        }
        if (this._options.pongTimeoutMs <= 1_000) {
            throw new Error("Pong timeout must be greater than 1 second");
        }
    }

    // ==========================
    // Public Methods
    // ==========================

    /** Start the heartbeat */
    public start(): void {
        this.stop();
        this._scheduleIdlePing();
    }

    /** Stop the heartbeat */
    public stop(): void {
        this._waitingForPong = false;
        this._clearIdleTimer();
        this._clearPongTimer();
    }

    /** Call on any received non-ping message — resets the idle timer. */
    public reset(): void {
        if (this._waitingForPong) {
            this._options.onLog?.("pong wait cancelled — activity received");
        }
        this._waitingForPong = false;
        this._clearPongTimer();
        this._scheduleIdlePing();
    }

    /** Returns true if the message is a ping response. */
    public isPingResponse(raw: string): boolean {
        try {
            return (JSON.parse(raw) as Record<string, unknown>)["id"] === this._pingId;
        } catch {
            return false;
        }
    }

    /** Handle a ping response */
    public handlePingResponse(raw: string): void {
        this._waitingForPong = false;
        this._clearPongTimer();

        try {
            const message = JSON.parse(raw) as {
                error?: { code: number; message: string };
            };

            if (message.error) {
                this._options.onFailure(
                    new Error(`ping failed (${message.error.code}: ${message.error.message})`),
                );
                return;
            }
        } catch {
            // Malformed pong — treat as success
        }

        this._options.onLog?.(`pong received at ${new Date().toISOString()}`);
        this._scheduleIdlePing();
    }

    // ==========================
    // Private Methods
    // ==========================

    /** Schedule the idle ping */
    private _scheduleIdlePing(): void {
        this._clearIdleTimer();

        this._idleTimer = setTimeout(() => {
            this._idleTimer = null;
            this._sendPing();
        }, this._options.idleTimeoutMs);
    }

    /** Send the ping */
    private _sendPing(): void {
        if (this._waitingForPong) {
            return; // Already waiting for a pong
        }

        this._waitingForPong = true;
        this._options.onLog?.(`ping sent at ${new Date().toISOString()}`);

        try {
            this._options.send(
                JSON.stringify({
                    jsonrpc: "2.0",
                    id: this._pingId,
                    method: this._options.method,
                    params: [],
                }),
            );
        } catch {
            this._waitingForPong = false;
            this._options.onFailure(new Error("failed to send ping"));
            return;
        }

        this._pongTimer = setTimeout(() => {
            this._pongTimer = null;

            if (!this._waitingForPong) {
                return; // Not waiting for a pong
            }
            this._waitingForPong = false;
            
            this._options.onFailure(
                new Error(`pong timeout after ${this._options.pongTimeoutMs}ms`),
            );
        }, this._options.pongTimeoutMs);
    }

    /** Clear the idle timer */
    private _clearIdleTimer(): void {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }
    }

    /** Clear the pong timer */
    private _clearPongTimer(): void {
        if (this._pongTimer) {
            clearTimeout(this._pongTimer);
            this._pongTimer = null;
        }
    }
}
