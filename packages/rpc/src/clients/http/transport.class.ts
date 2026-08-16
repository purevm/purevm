import type { RpcCall, RpcMethod, RpcRequest } from "../../types/rpc.types.js";
import { getTimeout } from "../../utils/timeout.js";
import { isRecord, isValidId, isRpcErrorObject } from "../../utils/rpc-guards.js";
import { RequestErrors, TransportErrors, HttpErrors, ResponseErrors } from "./errors.js";
import { createCancellationContext } from "../../utils/cancellation.js";
import { createRequestIdGenerator, type RequestIdGenerator } from "@/utils/request-id-generator.js";
import { TransportParametersManager } from "./transport.config.js";
import type { TransportParameters, RequestOptions } from "./transport.types.js";
import { getHttpHeaders } from "./utils/headers.js";

// ===========================================================
// Class
// ===========================================================

export class HttpTransport {
    /** Parameters manager for the HTTP transport */
    private readonly _parameters: TransportParametersManager;
    /** Generator for the request ID */
    private readonly _requestIdGenerator: RequestIdGenerator;

    // ===========================
    // Constructor
    // ===========================

    constructor(
        parameters: TransportParameters
    ) {
        this._parameters = new TransportParametersManager(parameters);
        this._requestIdGenerator = createRequestIdGenerator();
    }

    // ===========================
    // Public Methods
    // ===========================

    /** 
     * Sends a typed JSON-RPC request over HTTP and returns its `result`.
     */
    async request<M extends RpcMethod>(call: RpcCall<M>, opts: RequestOptions = {}): Promise<M["result"]> {
        const request = this._buildRequest(call);
        const timeout = opts.timeoutMs ? getTimeout(opts.timeoutMs) : this._parameters.timeoutMs;

        // ===============================
        // 1. Build request / body
        // ===============================

        let stringifiedRequest: string;
        try {
            stringifiedRequest = JSON.stringify(request);
        } catch (err: unknown) {
            throw RequestErrors.serialization({ cause: err });
        }

        // ===============================
        // Prepare cancellation / timeout
        // ===============================

        const cancellation = createCancellationContext({
            timeoutMs: timeout,
            signal: opts.signal
        });

        // ===============================
        // Send request + parse response as text
        // ===============================

        let response: Response;
        let text: string;
        try {
            response = await fetch(this._parameters.url, {
                method: "POST",
                headers: getHttpHeaders(this._parameters.headers, opts.headers),
                body: stringifiedRequest,
                signal: cancellation.signal,
            });

            // Buffer as text first: some nodes return JSON with a wrong Content-Type,
            // where response.json() throws opaquely. Reading text lets us surface the
            // raw payload (and proxy error pages) ourselves.
            text = await response.text();
        } 
        catch (err: unknown) {
            // fetch() rejects only on transport failures (DNS, ECONNREFUSED, ABORT).
            // HTTP 4xx/5xx resolve with `response.ok === false`.
            // fetch() resolves after receiving the response headers, while the body
            // may still be streaming. The timeout signal can therefore abort text().
            if (cancellation.timedOut) {
                throw TransportErrors.timeout({ timeout, cause: err });
            }
            if (cancellation.aborted) {
                throw TransportErrors.abort({ cause: err });
            }
            throw TransportErrors.network({ cause: err });
        } 
        finally {
            // Dispose the cancellation context.
            cancellation.dispose();
        }

        // ===============================
        // Parse response body as JSON
        // ===============================

        let json: unknown;
        try {
            json = JSON.parse(text);
        } 
        catch (err: unknown) {
            // A failed HTTP response without a JSON-RPC error envelope is an HTTP
            // error, even when a proxy returned HTML or another non-JSON body.
            if (!response.ok) {
                const { status, statusText } = response;
                throw HttpErrors.status({ body: text, status, statusText, cause: err });
            }
            // The HTTP request succeeded, but its body was not valid JSON body.
            throw ResponseErrors.body({ body: text, cause: err });
        }

        // ===============================
        // Validate JSON-RPC response
        // ===============================

        if (!isRecord(json)) {
            // HTTP response is not a non-null, non-array object and response is not ok
            if (!response.ok) {
                const { status, statusText } = response;
                throw HttpErrors.status({ body: text, status, statusText });
            }
            // HTTP response is a non-null, non-array object and response is ok
            throw ResponseErrors.invalid({ response: json });
        }

        if (json["jsonrpc"] !== "2.0") {
            // JSON-RPC response must specify version "2.0"
            throw ResponseErrors.invalid({ response: json });
        }

        if (!isValidId(json["id"])) {
            // JSON-RPC response has an invalid id
            throw ResponseErrors.invalid({ response: json });
        } else if (json["id"] !== request.id) {
            // JSON-RPC response id mismatch
            const expectedId = request.id;
            const responseId = json["id"];
            throw ResponseErrors.idMismatch({ expectedId, responseId, response: json });
        }

        const hasResult = Object.hasOwn(json, 'result');
        const hasError = Object.hasOwn(json, 'error');

        if (hasResult === hasError) {
            // JSON-RPC response must contain exactly one of "result" or "error", not both
            throw ResponseErrors.invalid({ response: json });
        }

        if (hasError) {
            // A valid JSON-RPC error takes precedence over the HTTP status because some
            // providers return useful RPC errors with 4xx or 5xx responses.
            if (isRpcErrorObject(json["error"])) {
                // JSON-RPC response has a valid error object
                throw ResponseErrors.error({ error: json["error"] });
            }
            // JSON-RPC response has an invalid error object
            throw ResponseErrors.invalid({ response: json });
        }

        if (!response.ok) {
            // HTTP response is not successful
            const { status, statusText } = response;
            throw HttpErrors.status({ body: text, status, statusText });
        }

        return json["result"] as M["result"];
    }

    // ===========================
    // Private Methods
    // ===========================

    /** 
     * Serializes a caller's request into a complete JSON-RPC 2.0 envelope.
     */
    private _buildRequest<M extends RpcMethod>(call: RpcCall<M>): RpcRequest {
        const request: RpcRequest = {
            id: this._requestIdGenerator.next(),
            jsonrpc: "2.0",
            method: call.method,
        };

        if (call.params !== undefined) {
            request.params = call.params;
        }

        return request;
    }
}
