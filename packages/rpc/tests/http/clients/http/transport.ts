import type { RpcCall, RpcMethod, RpcRequest } from "../types.js";
import { getHttpUrl, type HttpUrl, type HttpsUrl } from "./utils/url.js";
import { getTimeout, type TimeoutMs } from "./utils/timeout.js";
import { getHttpHeaders, type HttpHeadersInit } from "./utils/headers.js";

// ===========================================================
// Types
// ===========================================================

/** Configuration for an `HttpTransport` instance. */
export type HttpTransportParameters = {
    /** Fully-qualified provider endpoint, e.g. `https://rpc.example.com`. */
    url: HttpUrl | HttpsUrl;
    /** Per-request timeout in milliseconds. Must be a positive timer-safe integer. */
    timeoutMs: TimeoutMs;
    /** Optional: additional headers sent with every request. */
    headers?: HttpHeadersInit;
};

// ===========================================================
// Class
// ===========================================================

export class ClientTransport {
    /** The url of the transport */
    public readonly url: HttpUrl | HttpsUrl;
    /** The timeout for the transport */
    public readonly timeoutMs: TimeoutMs;
    /** Additional headers sent with every request. */
    private readonly _headers: Headers;
    /** Monotonic counter used to stamp each outgoing request's ID */
    public _id = 0;

    // ===========================
    // Constructor
    // ===========================

    constructor(
        parameters: HttpTransportParameters
    ) {
        this.url = getHttpUrl(parameters.url);
        this.timeoutMs = getTimeout(parameters.timeoutMs);
        this._headers = getHttpHeaders(parameters.headers);
    }

    // ===========================
    // Public Methods
    // ===========================

    /** 
     * Returns a mutable copy of the configured request headers.
     */
    public get headers(): Headers {
        return new Headers(this._headers);
    }

    /** 
     * Serializes a caller's request into a complete JSON-RPC 2.0 envelope.
     */
    public buildRequest<T extends RpcMethod>(call: RpcCall<T>): RpcRequest {
        const request: RpcRequest = {
            id: this.getNextId(),
            jsonrpc: "2.0",
            method: call.method,
        };
        if (call.params !== undefined) {
            request.params = call.params;
        }
        return request;
    }

    // ===========================
    // Protected Methods
    // ===========================

    /** 
     * Returns the next request ID (wrapping at MAX_SAFE_INTEGER)
     */
    protected getNextId(): number {
        this._id += 1;
        if (this._id > Number.MAX_SAFE_INTEGER) {
            this._id = 1;
        }
        return this._id;
    }
}
