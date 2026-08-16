import type { RpcCall, RpcMethod } from "../types.js";
import { ClientTransport, type HttpTransportParameters } from "./transport.js";
import { ClientError } from "./error.js";

import { getTimeout } from "./utils/timeout.js";
import { createRequestCancellationContext } from "./utils/abort.js";
import { isAbortError } from "./utils/error.js";
import { isObject, isRpcResponseSuccess, isRpcResponseError } from "./utils/response.js";

// ===========================================================
// Transport Types
// ===========================================================

/** Configuration for an {@link HttpClient} instance. */
export type HttpClientParameters = HttpTransportParameters;

/** Configuration for an {@link HttpClient} instance. */
export type HttpClientFetchOptions = {
    /** Optional: per-request timeout in milliseconds. Must be a positive timer-safe integer. */
    timeoutMs?: number;
    /** Optional signal used to cancel the request. */
    signal?: AbortSignal;
};

// ===========================================================
// Transport Class
// ===========================================================

export class HttpClient {
    /** The transport factory for the client. */
    private readonly _transport: ClientTransport;
    /** The error handler for the client. */
    private readonly _errors: ClientError;

    // ===========================
    // Constructor
    // ===========================

    constructor(
        parameters: HttpTransportParameters
    ) {
        this._transport = new ClientTransport(parameters);
        this._errors = new ClientError(parameters.url);
    }

    // ===========================
    // Public Methods
    // ===========================

    /** 
     * Sends a typed JSON-RPC request over HTTP and returns its `result`.
     */
    async request<T extends RpcMethod>(call: RpcCall<T>, opts: HttpClientFetchOptions = {}): Promise<T["ReturnType"]> {
        const request = this._transport.buildRequest(call);
        let stringifiedRequest: string;
        try {
            stringifiedRequest = JSON.stringify(request);
        } catch (err: unknown) {
            throw this._errors.serializationError(request, err);
        }

        const timeout = getTimeout(opts.timeoutMs ?? this._transport.timeoutMs);
        const abort = createRequestCancellationContext(timeout, opts.signal);

        try {
            const headers = this._transport.headers;

            // Send the request to the node / provider.
            let response: Response;
            try {
                response = await fetch(this._transport.url, {
                    method: "POST",
                    headers: headers,
                    body: stringifiedRequest,
                    signal: abort.signal,
                });
            } catch (err: unknown) {
                // fetch() rejects only on transport failures (DNS, ECONNREFUSED, ABORT).
                // HTTP 4xx/5xx resolve with `response.ok === false`.
                if (abort.aborted || isAbortError(err)) {
                    if (abort.didTimeout) {
                        throw this._errors.timeoutError(request, timeout, err);
                    }
                    throw this._errors.abortError(request, err);
                }
                // Throw network error on transport or network failures.
                throw this._errors.networkError(request, err);
            }

            let text: string;
            try {
                // Buffer as text first: some nodes return JSON with a wrong Content-Type,
                // where response.json() throws opaquely. Reading text lets us surface the
                // raw payload (and proxy error pages) ourselves.
                text = await response.text();
            } catch (err: unknown) {
                // fetch() resolves after receiving the response headers, while the body
                // may still be streaming. The timeout signal can therefore abort text().
                if (abort.signal.aborted || isAbortError(err)) {
                    if (abort.didTimeout) {
                        throw this._errors.timeoutError(request, timeout, err);
                    }
                    throw this._errors.abortError(request, err);
                }
                // The response headers arrived, but the body stream failed, for example
                // because the socket disconnected while the body was being downloaded.
                throw this._errors.networkError(request, err);
            }

            let json: unknown;
            try {
                json = JSON.parse(text);
            } catch (err: unknown) {
                // A failed HTTP response without a JSON-RPC error envelope is an HTTP
                // error, even when a proxy returned HTML or another non-JSON body.
                if (!response.ok) {
                    throw this._errors.httpStatusError(request, response.status, response.statusText, err);
                }
                // The HTTP request succeeded, but its body was not valid JSON.
                throw this._errors.parseError(request, err);
            }

            // A JSON-RPC response must be a non-null, non-array object.
            if (!isObject(json)) {
                // No JSON-RPC error envelope is available, so preserve the HTTP failure.
                if (!response.ok) {
                    throw this._errors.httpStatusError(request, response.status, response.statusText);
                }
                // HTTP succeeded, but the parsed body cannot be a JSON-RPC response.
                throw this._errors.invalidResponseError(request, json);
            }

            // A valid JSON-RPC error takes precedence over the HTTP status because some
            // providers return useful RPC errors with 4xx or 5xx responses.
            if (isRpcResponseError(json)) {
                if (json.id !== null && json.id !== request.id) {
                    throw this._errors.idMismatchError(request, json, json.id);
                }
                throw this._errors.providerError(request, json.error);
            }

            // If the HTTP request failed, throw an HTTP error.
            if (!response.ok) {
                throw this._errors.httpStatusError(request, response.status, response.statusText);
            }

            if (!isRpcResponseSuccess(json)) {
                throw this._errors.invalidResponseError(request, json);
            }

            if (json.id !== request.id) {
                throw this._errors.idMismatchError(request, json, json.id);
            }

            return json.result as T["ReturnType"];
        }
        finally {
            abort.dispose();
        }
    }
}
