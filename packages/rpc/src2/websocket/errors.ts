import {
    RpcAbortError,
    RpcInvalidResponseError,
    RpcProviderError,
    RpcSerializationError,
    RpcTimeoutError,
    SubscriptionError,
    UnsubscribeError,
    WebSocketConnectionError,
    WebSocketProtocolError,
} from "./errors/index.js";

export const RequestErrors = {
    abort(...args: ConstructorParameters<typeof RpcAbortError>) {
        return new RpcAbortError(...args);
    },
    serialization(...args: ConstructorParameters<typeof RpcSerializationError>) {
        return new RpcSerializationError(...args);
    },
    timeout(...args: ConstructorParameters<typeof RpcTimeoutError>) {
        return new RpcTimeoutError(...args);
    },
} as const;

export const ResponseErrors = {
    invalid(...args: ConstructorParameters<typeof RpcInvalidResponseError>) {
        return new RpcInvalidResponseError(...args);
    },
    provider(...args: ConstructorParameters<typeof RpcProviderError>) {
        return new RpcProviderError(...args);
    },
    protocol(...args: ConstructorParameters<typeof WebSocketProtocolError>) {
        return new WebSocketProtocolError(...args);
    },
} as const;

export const TransportErrors = {
    connection(...args: ConstructorParameters<typeof WebSocketConnectionError>) {
        return new WebSocketConnectionError(...args);
    },
} as const;

export const SubscriptionErrors = {
    subscribe(...args: ConstructorParameters<typeof SubscriptionError>) {
        return new SubscriptionError(...args);
    },
    unsubscribe(...args: ConstructorParameters<typeof UnsubscribeError>) {
        return new UnsubscribeError(...args);
    },
} as const;
