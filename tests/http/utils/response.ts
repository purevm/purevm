import type { RpcResponseSuccess, RpcResponseError } from "../../types.js";

// ============================================================
// Utils
// ============================================================

/**
 * Checks if a value is an object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
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
export function isJsonRpcId(value: unknown): value is string | number | null {
    const isSafeInteger = typeof value === "number" && Number.isSafeInteger(value);
    const isString = typeof value === "string";
    const isNull = value === null;

    return (
        isSafeInteger
        || isString
        || isNull
    )
}

/**
 * Checks that parsed JSON is a JSON-RPC success response envelope.
 */
export function isRpcResponseSuccess(value: unknown): value is RpcResponseSuccess {
    if (!isObject(value)) {
        return false;
    }

    const isIdValid = isJsonRpcId(value["id"]);
    const isJsonrpcValid = value["jsonrpc"] === "2.0";

    const hasResult = "result" in value;
    const hasNoError = !("error" in value);

    return (
        isJsonrpcValid
        && isIdValid
        && hasResult
        && hasNoError
    );
}

/**
 * Checks that parsed JSON is a JSON-RPC error response envelope.
 */
export function isRpcResponseError(value: unknown): value is RpcResponseError {
    if (!isObject(value)) {
        return false;
    }

    const error = value["error"];

    if (!isObject(error)) {
        return false;
    }

    const id = value["id"];
    const jsonrpc = value["jsonrpc"];
    const code = error["code"];
    const message = error["message"];

    const isIdValid = isJsonRpcId(id);
    const isJsonrpcValid = jsonrpc === "2.0";
    const isCodeValid = typeof code === "number";
    const isMessageValid = typeof message === "string";
    const hasNoResult = !("result" in value);

    return (
        isJsonrpcValid
        && isIdValid
        && isCodeValid
        && isMessageValid
        && hasNoResult
    );
}
