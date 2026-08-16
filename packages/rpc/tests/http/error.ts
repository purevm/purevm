import type { RpcError, RpcRequest, RpcResponse } from "../types.js";
import {
    RpcAbortError,
    RpcHttpStatusError,
    RpcIdMismatchError,
    RpcInvalidResponseError,
    RpcNetworkError,
    RpcParseError,
    RpcProviderError,
    RpcSerializationError,
    RpcTimeoutError,
} from "./errors/index.js";

// ===========================================================
// Error Class
// ===========================================================

export class ClientError {
    constructor(
        private readonly _url: string,
    ) {}

    // ===========================
    // Public Methods
    // ===========================

    /** Creates an RPC timeout error. */
    timeoutError(
        request: RpcRequest,
        timeoutMs: number,
        cause?: unknown,
    ): RpcTimeoutError {
        return new RpcTimeoutError({
            url: this._url,
            method: request.method,
            timeoutMs,
            cause,
        });
    }

    /** Creates an explicit request cancellation error. */
    abortError(
        request: RpcRequest,
        cause?: unknown,
    ): RpcAbortError {
        return new RpcAbortError({
            url: this._url,
            method: request.method,
            cause,
        });
    }

    /** Creates a network or transport error. */
    networkError(
        request: RpcRequest,
        cause?: unknown,
    ): RpcNetworkError {
        return new RpcNetworkError({
            url: this._url,
            method: request.method,
            cause,
        });
    }

    /** Creates a request serialization error. */
    serializationError(
        request: RpcRequest,
        cause?: unknown,
    ): RpcSerializationError {
        return new RpcSerializationError({
            url: this._url,
            method: request.method,
            cause,
        });
    }

    /** Creates an error for a non-successful HTTP status. */
    httpStatusError(
        request: RpcRequest,
        status: number,
        statusText: string,
        cause?: unknown,
    ): RpcHttpStatusError {
        return new RpcHttpStatusError({
            url: this._url,
            method: request.method,
            status,
            statusText,
            cause,
        });
    }

    /** Creates an invalid JSON-RPC response error. */
    invalidResponseError(
        request: RpcRequest,
        response: unknown,
    ): RpcInvalidResponseError {
        return new RpcInvalidResponseError({
            url: this._url,
            method: request.method,
            response,
        });
    }

    /** Creates an error for a mismatched JSON-RPC response ID. */
    idMismatchError(
        request: RpcRequest,
        response: unknown,
        responseId: RpcResponse['id'],
    ): RpcIdMismatchError {
        return new RpcIdMismatchError({
            url: this._url,
            method: request.method,
            expectedId: request.id,
            responseId,
            response,
        });
    }

    /** Creates an error for a response body that is not valid JSON. */
    parseError(
        request: RpcRequest,
        cause?: unknown,
    ): RpcParseError {
        return new RpcParseError({
            url: this._url,
            method: request.method,
            cause,
        });
    }

    /** Creates an error from a provider's JSON-RPC error object. */
    providerError(
        request: RpcRequest,
        rpcError: RpcError,
    ): RpcProviderError {
        return new RpcProviderError({
            url: this._url,
            method: request.method,
            rpcError,
        });
    }
}
