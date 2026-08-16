// ===========================================================
// Types
// ===========================================================

export type WebSocketTransportParameters = {
    /** URL for the WebSocket */
    url: `ws://${string}` | `wss://${string}`;
    /** Callback for the open event */
    onOpen: (event: Event) => void;
    /** Callback for the message event */
    onMessage: (event: MessageEvent) => void;
    /** Callback for the close event */
    onClose: (code: number, reason: string, event: CloseEvent) => void;
    /** Callback for the error event */
    onError: (error: Error, event: Event) => void;
    /** The callback for the log event (debug) */
    onLog?: (message: string) => void;
};

type WebSocketHandle = {
    /** WebSocket connection */
    ws: WebSocket;
    /** Listeners for the WebSocket */
    listeners: {
        /** Callback for the open event */
        open: (event: Event) => void;
        /** Callback for the message event */
        message: (event: MessageEvent) => void;
        /** Callback for the close event */
        close: (event: CloseEvent) => void;
        /** Callback for the error event */
        error: (event: Event) => void;
    };
};

// ===========================================================
// Class
// ===========================================================

export class WebSocketTransport {
    /** The parameters for the transport */
    private readonly _url: WebSocketTransportParameters["url"];
    /** The WebSocket instance */
    private _handle: WebSocketHandle | null = null;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly _parameters: WebSocketTransportParameters,
    ) {
        if (!_parameters.url.startsWith('ws://') && !_parameters.url.startsWith('wss://')) {
            throw new Error('Please provide a valid provider url (ws:// or wss://)');
        }
        this._url = _parameters.url;
    }

    // ==========================
    // Public Methods
    // ==========================

    /** Create a WebSocket connection */
    public create(): void {
        // Create a WebSocket native connection
        const ws = new WebSocket(this._url);

        // Create the listeners for the WebSocket connection
        const listeners: WebSocketHandle["listeners"] = {
            open: (event: Event) => {
                if (this._handle?.ws !== ws) {
                    return; // Not our socket
                }
                this._parameters.onLog?.(`connected at ${new Date().toISOString()}`);
                this._parameters.onOpen(event);
            },
            message: (event: MessageEvent) => {
                if (this._handle?.ws !== ws) {
                    return; // Not our socket
                }
                if (typeof event.data !== "string") {
                    const error = new Error("Expected string message");
                    this._parameters.onError(error, event);
                    return; // Not a string message
                }
                this._parameters.onMessage(event);
            },
            close: (event: CloseEvent) => {
                this._removeListeners(ws, listeners);

                if (this._handle?.ws !== ws) {
                    return; // Not our socket
                }
                this._handle = null;

                this._parameters.onLog?.(`closed (${event.code}: ${event.reason || "unknown"})`);
                this._parameters.onClose(event.code, event.reason || "unknown", event);
            },
            error: (event: Event) => {
                if (this._handle?.ws !== ws) {
                    return; // Not our socket
                }

                const maybeError = (event as { error?: unknown }).error;
            
                if (maybeError instanceof Error) {
                    this._parameters.onError(maybeError, event);
                    return;
                }
            
                if (typeof maybeError === "string") {
                    const error = new Error(maybeError);
                    this._parameters.onError(error, event);
                    return;
                }

                const error = new Error("WebSocket error");
                this._parameters.onError(error, event);
            },
        };

        ws.addEventListener("open", listeners.open);
        ws.addEventListener("message", listeners.message);
        ws.addEventListener("close", listeners.close);
        ws.addEventListener("error", listeners.error);

        const previous = this._handle;
        this._handle = { ws, listeners };
        this._parameters.onLog?.(`created new connection`);

        if (previous) {
            this._parameters.onLog?.(`destroying previous connection`);
            this._destroyHandle(previous);
        }
    }

    /** Destroy a WebSocket connection */
    public destroy(code = 1000, reason = "client_stop"): void {
        const handle = this._handle;

        if (!handle) {
            return; // No handle to destroy
        }

        this._handle = null;
        this._destroyHandle(handle, code, reason);
    }

    /** Send a message to the WebSocket */
    public send(data: string): void {
        const handle = this._handle;

        if (!handle || handle.ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }
        handle.ws.send(data);
    }

    // ==========================
    // Private Methods
    // ==========================

    /** Remove the listeners from the WebSocket handle */
    private _removeListeners(ws: WebSocket, listeners: WebSocketHandle["listeners"]): void {
        ws.removeEventListener("open", listeners.open);
        ws.removeEventListener("message", listeners.message);
        ws.removeEventListener("close", listeners.close);
        ws.removeEventListener("error", listeners.error);
    }

    /** Destroy the WebSocket handle */
    private _destroyHandle(handle: WebSocketHandle, code = 1000, reason = "replaced"): void {
        this._removeListeners(handle.ws, handle.listeners);
        if (
            handle.ws.readyState === WebSocket.CONNECTING ||
            handle.ws.readyState === WebSocket.OPEN
        ) {
            handle.ws.close(code, reason);
            // Node.js 22 native: terminate() is not needed, close() is sufficient.
            // Listeners have already been removed, so there are no zombie callbacks.
            // The socket will be garbage collected once the close handshake is complete.
        }
    }
}
