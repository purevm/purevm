// ===========================================================
// JSON-RPC Types
// ===========================================================

export type JsonRpcId = number | string;

export type JsonRpcErrorObject = {
    readonly code: number;
    readonly message: string;
    readonly data?: unknown;
}

// ===========================================================
// JSON-RPC Request Types
// ===========================================================

export type JsonRpcRequest = {
    readonly method: string;
    readonly params?: readonly unknown[];
    readonly timeout?: number;
}

export type JsonRpcResponseSuccess<result = unknown> = {
    readonly id: JsonRpcId;
    readonly jsonrpc: "2.0";
    readonly result: result;
}

export type JsonRpcResponseFailure = {
    readonly id: JsonRpcId;
    readonly jsonrpc: "2.0";
    readonly error: JsonRpcErrorObject;
}

export type JsonRpcResponse<result = unknown> =
    | JsonRpcResponseSuccess<result>
    | JsonRpcResponseFailure;

// ===========================================================
// JSON-RPC Subscription Types
// ===========================================================

export type JsonRpcSubscriptionNotification<result = unknown> = {
    jsonrpc: '2.0'
    method: 'eth_subscription'
    params: {
        subscription: string
        result: result
    }
}

export type SubscriptionParameters = readonly [string, ...unknown[]]

export type SubscribeOptions<result = unknown> = {
    params: SubscriptionParameters
    onData: (
        result: result,
        message: JsonRpcSubscriptionNotification<result>,
    ) => void
    onError?: (error: Error) => void
    timeout?: number
}