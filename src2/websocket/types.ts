// ===========================================================
// JSON-RPC Types
// ===========================================================

export type JsonRpcId = number | string | null;

export type JsonRpcErrorObject = {
    readonly code: number;
    readonly message: string;
    readonly data?: unknown;
};

export type JsonRpcRequest = {
    readonly id: number;
    readonly jsonrpc: "2.0";
    readonly method: string;
    readonly params?: readonly unknown[];
};

export type JsonRpcSuccess = {
    readonly id: JsonRpcId;
    readonly jsonrpc: "2.0";
    readonly result: unknown;
};

export type JsonRpcFailure = {
    readonly id: JsonRpcId;
    readonly jsonrpc: "2.0";
    readonly error: JsonRpcErrorObject;
};

export type JsonRpcResponse = JsonRpcFailure | JsonRpcSuccess;

export type JsonRpcSubscriptionNotification = {
    readonly jsonrpc: "2.0";
    readonly method: "eth_subscription";
    readonly params: {
        readonly subscription: string;
        readonly result: unknown;
    };
};

// ===========================================================
// WebSocket Types
// ===========================================================

export type WebSocketCloseInfo = {
    readonly code: number;
    readonly reason: string;
    readonly wasClean: boolean;
};

export type WebSocketLike = {
    readonly readyState: number;
    addEventListener(
        type: "open",
        listener: (event: Event) => void,
    ): void;
    addEventListener(
        type: "message",
        listener: (event: MessageEvent) => void,
    ): void;
    addEventListener(
        type: "close",
        listener: (event: CloseEvent) => void,
    ): void;
    addEventListener(
        type: "error",
        listener: (event: Event) => void,
    ): void;
    removeEventListener(
        type: "open",
        listener: (event: Event) => void,
    ): void;
    removeEventListener(
        type: "message",
        listener: (event: MessageEvent) => void,
    ): void;
    removeEventListener(
        type: "close",
        listener: (event: CloseEvent) => void,
    ): void;
    removeEventListener(
        type: "error",
        listener: (event: Event) => void,
    ): void;
    close(code?: number, reason?: string): void;
    send(data: string): void;
};

export type WebSocketFactory = (
    url: import("./utils/url.js").WsUrl | import("./utils/url.js").WssUrl,
) => WebSocketLike;

// ===========================================================
// Subscription Types
// ===========================================================

export type SubscriptionHandle = {
    getSubscriptionId(): string | null;
    unsubscribe(): Promise<void>;
};
