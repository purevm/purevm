import {
    RpcAbortError,
    RpcHttpStatusError,
    RpcIdMismatchError,
    RpcInvalidResponseError,
    RpcNetworkError,
    RpcParseBodyError,
    RpcProviderError,
    RpcSerializationError,
    RpcTimeoutError,
} from "./errors/index.js";

/**
 * Errors related to the response body.
 */
export const ResponseErrors = {
    body(
        ...args: ConstructorParameters<typeof RpcParseBodyError>
    ) {
        return new RpcParseBodyError(...args);
    },
    invalid(
        ...args: ConstructorParameters<typeof RpcInvalidResponseError>
    ) {
        return new RpcInvalidResponseError(...args);
    },
    idMismatch(
        ...args: ConstructorParameters<typeof RpcIdMismatchError>
    ) {
        return new RpcIdMismatchError(...args);
    },
    error(
        ...args: ConstructorParameters<typeof RpcProviderError>
    ) {
        return new RpcProviderError(...args);
    },
} as const;

/**
 * Errors related to the transport.
 */
export const TransportErrors = {
    timeout(
        ...args: ConstructorParameters<typeof RpcTimeoutError>
    ) {
        return new RpcTimeoutError(...args);
    },
    abort(
        ...args: ConstructorParameters<typeof RpcAbortError>
    ) {
        return new RpcAbortError(...args);
    },
    network(
        ...args: ConstructorParameters<typeof RpcNetworkError>
    ) {
        return new RpcNetworkError(...args);
    },
} as const;

/**
 * Errors related to the request.
 */
export const RequestErrors = {
    serialization(
        ...args: ConstructorParameters<typeof RpcSerializationError>
    ) {
        return new RpcSerializationError(...args);
    },
} as const;

/**
 * Errors related to the HTTP response.
 */
export const HttpErrors = {
    status(
        ...args: ConstructorParameters<typeof RpcHttpStatusError>
    ) {
        return new RpcHttpStatusError(...args);
    },
} as const;
