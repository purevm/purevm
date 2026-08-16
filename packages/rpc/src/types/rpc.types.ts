import type { JsonValue } from "./json.types.js";

// ============================================================
// JSON-RPC Types
// ============================================================

/**
 * Type representing a JSON-RPC id.
 */
export type RpcId = number | string | null

/**
 * Type representing a JSON-RPC params.
 */
export type RpcParams = readonly JsonValue[] | { readonly [key: string]: JsonValue }

/**
 * Type representing a JSON-RPC method.
 */
export type RpcMethod = {
    method: string
    params?: RpcParams | undefined
    result: JsonValue
}

/**
 * Type representing a JSON-RPC error object.
 */
export type RpcErrorObject = {
    code: number
    message: string
    data?: JsonValue | undefined
}

// ============================================================
// JSON-RPC Request and Response Types
// ============================================================

/**
 * Type representing a JSON-RPC request.
 */
export type RpcRequest<P extends RpcParams = RpcParams> = {
    id: number
    jsonrpc: '2.0'
    method: string
    params?: P | undefined
}

/**
 * Type representing a JSON-RPC success response.
 */
export type RpcResponseSuccess<result extends JsonValue = JsonValue> = {
    id: RpcId
    jsonrpc: '2.0'
    result: result
}

/**
 * Type representing a JSON-RPC failure response.
 */
export type RpcResponseFailure = {
    id: RpcId
    jsonrpc: '2.0'
    error: RpcErrorObject
}

/**
 * Type representing a JSON-RPC request.
 */
export type RpcCall<T extends RpcMethod> = {
    method: T["method"];
} & (
    undefined extends T["params"]
        ? { params?: T["params"] }
        : { params: T["params"] }
);

// ============================================================
// JSON-RPC Request and Response Types
// ============================================================

export type SubscriptionNotification<result = unknown> = {
    jsonrpc: '2.0'
    method: 'eth_subscription'
    params: {
        subscription: string
        result: result
    }
}
