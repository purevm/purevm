import type { HttpHeadersInit } from "./utils/headers.js";
import type { HttpUrl, HttpsUrl } from "./utils/url.js";
import type { TimeoutMs } from "../../utils/timeout.js";

/**
 * Parameters for the HTTP transport
 */
export type TransportParameters = {
    /** Fully-qualified provider endpoint, e.g. `https://rpc.example.com`. */
    url: HttpUrl | HttpsUrl;
    /** Per-request timeout in milliseconds. Must be a positive timer-safe integer. */
    timeoutMs: TimeoutMs;
    /** Optional: additional headers sent with every request. */
    headers?: HttpHeadersInit | undefined;
};

/**
 * Options for a request to the HTTP transport
 */
export type RequestOptions = {
    /** Optional: additional headers for this request. Overrides transport headers. */
    headers?: HttpHeadersInit | undefined;
    /** Optional signal used to cancel the request. */
    signal?: AbortSignal | undefined;
    /** Optional: per-request timeout in milliseconds. Must be a positive timer-safe integer. */
    timeoutMs?: number | undefined;
};
