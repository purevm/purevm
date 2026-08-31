# @purevm/transports

Small, dependency-free [JSON-RPC 2.0](https://www.jsonrpc.org/specification) transports for HTTP
and WebSocket. Both transports share request types, timeout rules, retry policy, response
validation, and typed errors.

## Overview

### Installation

```bash
pnpm add @purevm/transports
```

The package is ESM-only and targets ES2022. HTTP requires the
[`fetch`](https://developer.mozilla.org/docs/Web/API/Window/fetch) API. WebSocket requires the
[`WebSocket`](https://developer.mozilla.org/docs/Web/API/WebSocket) API. Custom implementations can
be supplied when a runtime does not provide them.

### Features

- Typed JSON-RPC requests and results
- HTTP and WebSocket transports with the same `request` interface
- Per-transport and per-request timeouts
- Configurable exponential retry behavior
- External `AbortSignal` cancellation
- JSON-RPC envelope and request ID validation
- Typed transport, network, provider, timeout, and protocol errors
- WebSocket subscriptions with unsubscribe support
- Automatic WebSocket reconnect and subscription restoration
- No runtime dependencies

### Scope

This package handles transport mechanics only. It does not define `eth_`, `debug_`, or `trace_`
method catalogs, encode Ethereum values, batch requests, manage accounts, or sign transactions.
Higher-level RPC packages can define method types and pass them to these transports.

### Exports

| Export                                        | Purpose                                                  |
| --------------------------------------------- | -------------------------------------------------------- |
| [`HttpTransport`](#httptransport)             | Sends JSON-RPC requests over HTTP.                       |
| [`WebSocketTransport`](#websockettransport)   | Sends requests and manages subscriptions over WebSocket. |
| [`parseHttpUrl`](#parsehttpurl)               | Validates and normalizes an HTTP endpoint.               |
| [`Transport`](#shared-types)                  | Common request interface implemented by both transports. |
| [`RpcMethod`](#typed-methods)                 | Describes a method name, parameters, and result type.    |
| [`RpcCall`](#typed-methods)                   | Derives the call shape for an `RpcMethod`.               |
| [`RequestOptions`](#request-options)          | Configures one request.                                  |
| [`RetryOptions`](#retry-options)              | Configures retry count, delay, backoff, and filtering.   |
| [`RpcSubscription`](#websocket-subscriptions) | Represents an active WebSocket subscription.             |
| [`TransportError`](#errors)                   | Base class for package errors.                           |
| [`isRetryableError`](#errors)                 | Reports whether an error is a retryable transport error. |
| `HTTP_ERROR_CODE_MAP`                         | Known HTTP error names and messages.                     |
| `RPC_ERROR_CODE_MAP`                          | Known JSON-RPC error names and messages.                 |
| `isRetryableHttpStatus`                       | Classifies retryable HTTP status codes.                  |
| `isRetryableRpcErrorCode`                     | Classifies retryable JSON-RPC error codes.               |

### Typed Methods

Define each RPC method with [`RpcMethod`](#exports), then pass that type to `request`. The method
type controls the accepted call and inferred result.

```ts
import { HttpTransport, type RpcMethod } from "@purevm/transports";

type EthGetBalance = RpcMethod & {
  method: "eth_getBalance";
  params: readonly [`0x${string}`, "latest" | `0x${string}`];
  result: `0x${string}`;
};

const transport = new HttpTransport({
  url: "https://ethereum-rpc.publicnode.com",
});

const balance = await transport.request<EthGetBalance>({
  method: "eth_getBalance",
  params: ["0x0000000000000000000000000000000000000000", "latest"],
});
```

For a method without parameters, declare `params?: undefined`.

```ts
import { HttpTransport, type RpcMethod } from "@purevm/transports";

type EthChainId = RpcMethod & {
  method: "eth_chainId";
  params?: undefined;
  result: `0x${string}`;
};

const transport = new HttpTransport({
  url: "https://ethereum-rpc.publicnode.com",
});

const chainId = await transport.request<EthChainId>({ method: "eth_chainId" });
```

### Shared Types

```ts
import type {
  HttpHeaders,
  HttpRequestOptions,
  HttpTransportOptions,
  HttpUrl,
  JsonPrimitive,
  JsonValue,
  RequestOptions,
  RetryOptions,
  RpcCall,
  RpcErrorObject,
  RpcId,
  RpcMethod,
  RpcParams,
  RpcRequest,
  RpcSubscription,
  SubscribeOptions,
  Transport,
  TransportErrorOptions,
  TransportOptions,
  WebSocketEvent,
  WebSocketFactory,
  WebSocketLike,
  WebSocketListener,
  WebSocketTransportOptions,
} from "@purevm/transports";
```

`JsonValue` intentionally excludes `bigint`, functions, symbols, and class instances. Convert
Ethereum quantities to JSON-RPC hex strings before sending them.

### Request Options

[`RequestOptions`](#exports) can override timeout and retry behavior for one request.

| Option      | Type                    | Default                     | Description                                  |
| ----------- | ----------------------- | --------------------------- | -------------------------------------------- |
| `signal`    | `AbortSignal`           | `undefined`                 | Cancels connection, request, or retry delay. |
| `timeoutMs` | `number`                | Transport value or `10_000` | Timeout for each request attempt.            |
| `retry`     | `false \| RetryOptions` | Transport value or defaults | Disables or overrides retry behavior.        |

HTTP requests also accept `headers`. Request headers override transport headers.

### Retry Options

[`RetryOptions`](#exports) uses exponential backoff.

| Option        | Default            | Description                                             |
| ------------- | ------------------ | ------------------------------------------------------- |
| `retries`     | `2`                | Number of retries after the initial attempt.            |
| `delayMs`     | `100`              | Delay before the first retry.                           |
| `maxDelayMs`  | `1_000`            | Maximum delay between retries.                          |
| `factor`      | `2`                | Multiplier applied after each failed attempt.           |
| `shouldRetry` | `isRetryableError` | Receives the error and one-based failed-attempt number. |

Default retry classification includes:

- Network failures
- Request timeouts
- WebSocket connection failures
- HTTP statuses `408`, `429`, `500`, `502`, `503`, `504`, and `520` through `524`
- Provider codes `-1`, `-32603`, `-32002`, `-32005`, and `429`

Caller aborts, serialization failures, malformed responses, closed transports, and other provider
errors are not retried by default.

### Error Metadata

HTTP and JSON-RPC metadata follows Viem's error taxonomy and EIP-1474 naming. The maps and helpers
are exported so higher-level packages can reuse the same classifications without duplicating them.

```ts
import {
  HTTP_ERROR_CODE_MAP,
  RETRYABLE_HTTP_STATUS_CODES,
  RETRYABLE_RPC_ERROR_CODES,
  RPC_ERROR_CODE_MAP,
  getHttpErrorDefinition,
  getRpcErrorDefinition,
  isRetryableHttpStatus,
  isRetryableRpcErrorCode,
} from "@purevm/transports";

const httpError = getHttpErrorDefinition(429);
const rpcError = getRpcErrorDefinition(-32602);

isRetryableHttpStatus(503); // true
isRetryableRpcErrorCode(-32005); // true
```

### Errors

All package errors extend [`TransportError`](#exports). Every error includes a stable `code`, a
`retryable` boolean, and the original `cause` when available.

```ts
import {
  HttpStatusError,
  RpcAbortError,
  RpcIdMismatchError,
  RpcInvalidResponseError,
  RpcNetworkError,
  RpcParseBodyError,
  RpcProviderError,
  RpcResponseError,
  RpcSerializationError,
  RpcSubscriptionError,
  RpcTimeoutError,
  RpcUnsubscribeError,
  TransportError,
  WebSocketClosedError,
  WebSocketConnectionError,
  WebSocketProtocolError,
  WebSocketStoppedError,
  isRetryableError,
} from "@purevm/transports";
```

| Error                      | Code                   | Default Retry    | Extra Data                                    |
| -------------------------- | ---------------------- | ---------------- | --------------------------------------------- |
| `HttpStatusError`          | `HTTP_STATUS`          | Status-dependent | `status`, `statusName`, `statusText`, `body`  |
| `RpcAbortError`            | `RPC_ABORTED`          | No               | Caller abort reason in `cause`                |
| `RpcIdMismatchError`       | `RPC_ID_MISMATCH`      | No               | `expectedId`, `responseId`, `response`        |
| `RpcInvalidResponseError`  | `RPC_INVALID_RESPONSE` | No               | Invalid value in `response`                   |
| `RpcNetworkError`          | `RPC_NETWORK`          | Yes              | Network failure in `cause`                    |
| `RpcParseBodyError`        | `RPC_PARSE_BODY`       | No               | Invalid body in `body` and `response`         |
| `RpcProviderError`         | `RPC_PROVIDER`         | Code-dependent   | `rpcCode`, `rpcName`, `rpcMessage`, `rpcData` |
| `RpcResponseError`         | `RPC_RESPONSE`         | No               | Invalid value in `response`                   |
| `RpcSerializationError`    | `RPC_SERIALIZATION`    | No               | Serialization failure in `cause`              |
| `RpcSubscriptionError`     | `RPC_SUBSCRIPTION`     | No               | Invalid value in `response`                   |
| `RpcTimeoutError`          | `RPC_TIMEOUT`          | Yes              | `timeoutMs`                                   |
| `RpcUnsubscribeError`      | `RPC_UNSUBSCRIBE`      | No               | Invalid value in `response`                   |
| `WebSocketClosedError`     | `WEBSOCKET_CLOSED`     | No               | None                                          |
| `WebSocketConnectionError` | `WEBSOCKET_CONNECTION` | Yes              | Connection failure in `cause`                 |
| `WebSocketProtocolError`   | `WEBSOCKET_PROTOCOL`   | No               | `raw`, invalid value in `response`            |
| `WebSocketStoppedError`    | `WEBSOCKET_STOPPED`    | No               | None                                          |

Use `instanceof` when handling a specific failure. Use
[`isRetryableError`](#exports) when only retry classification matters.

```ts
import {
  HttpTransport,
  RpcProviderError,
  RpcTimeoutError,
  isRetryableError,
  type RpcMethod,
} from "@purevm/transports";

type EthBlockNumber = RpcMethod & {
  method: "eth_blockNumber";
  params?: undefined;
  result: `0x${string}`;
};

const transport = new HttpTransport({
  url: "https://ethereum-rpc.publicnode.com",
});

try {
  await transport.request<EthBlockNumber>({ method: "eth_blockNumber" });
} catch (error) {
  if (error instanceof RpcTimeoutError) {
    console.error(`Timed out after ${error.timeoutMs}ms`);
  } else if (error instanceof RpcProviderError) {
    console.error(error.rpcCode, error.rpcData);
  } else if (isRetryableError(error)) {
    console.error("Transient transport failure");
  }
}
```

### HttpTransport

[`HttpTransport`](#exports) sends one JSON-RPC request per HTTP `POST`. It validates response
version, ID, result and error exclusivity, and provider error shape.

```ts
import { HttpTransport } from "@purevm/transports";

const transport = new HttpTransport({
  url: "https://ethereum-rpc.publicnode.com",
  headers: {
    "x-client-name": "purevm",
  },
  timeoutMs: 10_000,
  retry: {
    retries: 2,
    delayMs: 100,
    maxDelayMs: 1_000,
    factor: 2,
  },
});
```

#### HTTP Transport Members

| Member                       | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `new HttpTransport(options)` | Validates configuration and creates a transport.        |
| `url`                        | Normalized endpoint without embedded basic credentials. |
| `request(call, options?)`    | Sends a typed JSON-RPC call and returns its result.     |

#### HTTP Transport Options

| Option      | Type                      | Required | Description                         |
| ----------- | ------------------------- | -------- | ----------------------------------- |
| `url`       | `string`                  | Yes      | Endpoint using `http:` or `https:`. |
| `headers`   | `HeadersInit`             | No       | Headers applied to every request.   |
| `fetch`     | `typeof globalThis.fetch` | No       | Custom fetch implementation.        |
| `timeoutMs` | `number`                  | No       | Timeout for each attempt.           |
| `retry`     | `false \| RetryOptions`   | No       | Retry policy.                       |

Basic credentials in the URL are converted to an `Authorization` header and removed from the
request URL. Explicit transport or request authorization headers take precedence.

### parseHttpUrl

[`parseHttpUrl`](#exports) validates an endpoint, normalizes it with `URL`, and extracts basic
credentials.

```ts
import { parseHttpUrl } from "@purevm/transports";

const parsed = parseHttpUrl("https://user:pass@rpc.example.com");

console.log(parsed.url);
console.log(parsed.authorization);
```

The return value contains `url` and an optional `authorization` header value. Surrounding
whitespace and protocols other than `http:` or `https:` throw `TypeError`.

### WebSocketTransport

[`WebSocketTransport`](#exports) supports regular JSON-RPC requests and Ethereum
[`eth_subscribe`](https://ethereum.org/developers/apis/json-rpc/#eth_subscribe) subscriptions.

```ts
import { WebSocketTransport } from "@purevm/transports";

const transport = new WebSocketTransport({
  url: "wss://ethereum-rpc.publicnode.com",
  timeoutMs: 10_000,
  retry: {
    retries: 2,
    delayMs: 100,
  },
  onError(error) {
    console.error(error);
  },
});

await transport.connect();
console.log(transport.connected);
```

#### WebSocket Transport Members

| Member                                | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `new WebSocketTransport(options)`     | Validates configuration and creates a transport.           |
| `url`                                 | Normalized WebSocket endpoint.                             |
| `connected`                           | Reports whether the socket is currently open.              |
| `connect(options?)`                   | Opens the socket without sending a request.                |
| `request(call, options?)`             | Sends a typed JSON-RPC call and returns its result.        |
| `subscribe(options, requestOptions?)` | Creates an Ethereum subscription.                          |
| `close()`                             | Rejects pending work and permanently closes the transport. |

#### WebSocket Transport Options

| Option            | Type                     | Required | Description                                                    |
| ----------------- | ------------------------ | -------- | -------------------------------------------------------------- |
| `url`             | `string`                 | Yes      | Endpoint using `ws:` or `wss:`.                                |
| `createWebSocket` | `WebSocketFactory`       | No       | Custom WebSocket factory.                                      |
| `onError`         | `(error: Error) => void` | No       | Reports unsolicited protocol and subscription callback errors. |
| `timeoutMs`       | `number`                 | No       | Connection and request timeout.                                |
| `retry`           | `false \| RetryOptions`  | No       | Request and reconnect policy.                                  |

Call `close()` when the transport is no longer needed. Closing rejects pending requests, unbinds
subscriptions, closes the socket, and permanently stops that transport instance.

### WebSocket Subscriptions

[`RpcSubscription`](#exports) exposes the current provider subscription ID and an `unsubscribe`
method. The ID can change after reconnection.

```ts
import { WebSocketTransport, type RpcSubscription } from "@purevm/transports";

type NewHead = {
  hash: `0x${string}`;
  number: `0x${string}`;
};

const transport = new WebSocketTransport({
  url: "wss://ethereum-rpc.publicnode.com",
});

const subscription: RpcSubscription = await transport.subscribe<NewHead>({
  params: ["newHeads"],
  onData(head) {
    console.log(head.number, head.hash);
  },
  onError(error) {
    console.error(error);
  },
});

console.log(subscription.id);
await subscription.unsubscribe();
transport.close();
```

When a socket closes with active subscriptions, the transport reconnects according to its retry
policy and sends new `eth_subscribe` requests. Each subscription object exposes its latest ID.
Pending requests reject on disconnect and can retry independently.

#### Subscription Members

| Member                  | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `id`                    | Current provider subscription ID, or `undefined` while disconnected.   |
| `unsubscribe(options?)` | Removes the local subscription and sends `eth_unsubscribe` when bound. |

## Recipes

### Override One Request

```ts
import { HttpTransport, type RpcMethod } from "@purevm/transports";

type DebugTraceTransaction = RpcMethod & {
  method: "debug_traceTransaction";
  params: readonly [`0x${string}`, { tracer: "callTracer" }];
  result: unknown;
};

const transport = new HttpTransport({
  url: "https://rpc.example.com",
  timeoutMs: 10_000,
  retry: { retries: 2 },
});

const trace = await transport.request<DebugTraceTransaction>(
  {
    method: "debug_traceTransaction",
    params: ["0x0123456789abcdef", { tracer: "callTracer" }],
  },
  {
    timeoutMs: 30_000,
    retry: false,
    headers: { "x-request-purpose": "debug-trace" },
  },
);
```

### Cancel a Request

The standard [`AbortController`](https://developer.mozilla.org/docs/Web/API/AbortController)
cancels active work and retry delays.

```ts
import { HttpTransport, type RpcMethod } from "@purevm/transports";

type TraceBlock = RpcMethod & {
  method: "trace_block";
  params: readonly [`0x${string}`];
  result: unknown[];
};

const transport = new HttpTransport({
  url: "https://rpc.example.com",
});
const controller = new AbortController();

const trace = transport.request<TraceBlock>(
  { method: "trace_block", params: ["0x1234"] },
  { signal: controller.signal },
);

controller.abort("No longer needed");
await trace;
```

### Customize Retry Decisions

```ts
import {
  HttpStatusError,
  HttpTransport,
  isRetryableError,
  type RpcMethod,
} from "@purevm/transports";

type EthBlockNumber = RpcMethod & {
  method: "eth_blockNumber";
  params?: undefined;
  result: `0x${string}`;
};

const transport = new HttpTransport({
  url: "https://ethereum-rpc.publicnode.com",
  retry: {
    retries: 4,
    delayMs: 250,
    maxDelayMs: 2_000,
    factor: 2,
    shouldRetry(error, attempt) {
      if (error instanceof HttpStatusError && error.status === 429) return attempt <= 4;
      return isRetryableError(error);
    },
  },
});

const blockNumber = await transport.request<EthBlockNumber>({ method: "eth_blockNumber" });
```

### Supply a Custom Fetch Implementation

```ts
import { HttpTransport, type RpcMethod } from "@purevm/transports";

type EthChainId = RpcMethod & {
  method: "eth_chainId";
  params?: undefined;
  result: `0x${string}`;
};

const instrumentedFetch: typeof globalThis.fetch = async (input, init) => {
  const startedAt = performance.now();
  try {
    return await fetch(input, init);
  } finally {
    console.log(`RPC request took ${performance.now() - startedAt}ms`);
  }
};

const transport = new HttpTransport({
  url: "https://ethereum-rpc.publicnode.com",
  fetch: instrumentedFetch,
});

const chainId = await transport.request<EthChainId>({ method: "eth_chainId" });
```

### Supply a Custom WebSocket Factory

```ts
import { WebSocketTransport, type WebSocketFactory, type WebSocketLike } from "@purevm/transports";

declare const RuntimeWebSocket: new (url: string) => WebSocketLike;

const createWebSocket: WebSocketFactory = (url) => new RuntimeWebSocket(url);

const transport = new WebSocketTransport({
  url: "wss://ethereum-rpc.publicnode.com",
  createWebSocket,
});

await transport.connect();
```

## Best Practices

- Reuse one transport instance so request IDs, connections, and subscriptions remain coordinated.
- Set longer per-request timeouts for expensive `debug_` and `trace_` methods.
- Disable retries for calls where repeating work is undesirable.
- Keep `shouldRetry` conservative. Invalid requests and deterministic provider errors do not
  become successful through retries.
- Pass an `AbortSignal` from application lifecycle boundaries.
- Handle `RpcProviderError` separately from network and timeout failures.
- Treat WebSocket subscription IDs as mutable because reconnection creates new provider IDs.
- Call `unsubscribe()` for individual subscriptions and `close()` during application shutdown.
- Use deterministic local fakes for unit tests. Keep live endpoint checks in integration tests.

## See More

- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Ethereum JSON-RPC API](https://ethereum.org/developers/apis/json-rpc/)
- [MDN Fetch API](https://developer.mozilla.org/docs/Web/API/Fetch_API)
- [MDN WebSocket API](https://developer.mozilla.org/docs/Web/API/WebSocket)
