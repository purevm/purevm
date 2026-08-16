// ============================================================
// Base Rpc Error
// ============================================================

type RpcErrorArgs = {
    /** RPC endpoint used for the request. */
    url: string;
    /** JSON-RPC method that failed. */
    method: string;
    /** Human-readable error message. */
    message: string;
    /** Original error, response, or thrown value. */
    cause?: unknown;
};

/**
 * Base class for failures raised while preparing, sending, or decoding an
 * HTTP JSON-RPC request.
 *
 * Every concrete client error includes the endpoint, RPC method, original
 * cause when available, and whether retrying could succeed.
 */
export abstract class RpcClientError extends Error {
    /** Error class name. */
    abstract override readonly name: string;

    /** JSON-RPC method that triggered the failure. */
    readonly method: string;

    /** RPC endpoint used for the failed request. */
    readonly url: string;

    /**
     * Creates a new RPC error.
     */
    protected constructor(args: RpcErrorArgs) {
        super(args.message, { cause: args.cause });

        this.method = args.method;
        this.url = args.url;
    }

    /**
     * Whether retrying the exact same request could realistically succeed.
     *
     * Examples:
     * - `true`: timeout, rate limit, temporary network failure
     * - `false`: invalid params, unsupported method, malformed response
     */
    abstract get retryable(): boolean;
}
