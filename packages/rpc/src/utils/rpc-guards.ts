import type { RpcId, RpcErrorObject } from "../types/rpc.types.js";

/**
 * Checks if a value is a record (object).
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    const isObject = typeof value === 'object';
    const isNotNull = value !== null;
    const isNotArray = !Array.isArray(value);

    return (
        isObject
        && isNotNull
        && isNotArray
    )
}

/**
 * Checks if a value is a JSON-RPC id.
 */
export function isValidId(value: unknown): value is RpcId {
    const isSafeInteger = typeof value === "number" && Number.isSafeInteger(value);
    const isString = typeof value === "string";
    const isNull = value === null;

    return (
        isSafeInteger ||
        isString ||
        isNull
    )
}

/**
 * Checks that parsed JSON is a JSON-RPC error response envelope.
 */
export function isRpcErrorObject(value: unknown): value is RpcErrorObject {
    return (
        isRecord(value) &&
        typeof value["code"] === 'number' &&
        typeof value["message"] === 'string'
    )
}
