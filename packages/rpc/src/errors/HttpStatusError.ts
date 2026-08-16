/**
 * The endpoint returned a non-successful HTTP status without a valid JSON-RPC error envelope.
 *
 * A valid JSON-RPC error takes precedence and is represented by
 * {@link RpcProviderError}, even when returned with a 4xx or 5xx status.
 */
export class HttpStatusError extends Error {
    override readonly name = this.constructor.name;
    readonly statusText: string;
    readonly status: number;
    readonly body: string;

    constructor(args: {
        body: string;
        status: number;
        statusText?: string;
        cause?: unknown;
    }) {
        const statusText = args.statusText?.trim() ?? '';
        super(`HTTP ${args.status} ${statusText ? statusText : 'error'}`, {
            cause: args.cause 
        });
        this.body = args.body;
        this.status = args.status;
        this.statusText = statusText;
    }

    get retryable(): boolean {
        // Retryable HTTP status codes
        return (
            // Standard timeout and unavailability
            this.status === 408 || // Request Timeout
            this.status === 429 || // Too Many Requests (Rate limited)
            this.status === 500 || // Internal Server Error
            this.status === 502 || // Bad Gateway
            this.status === 503 || // Service Unavailable
            this.status === 504 || // Gateway Timeout
            // Cloudflare and similar edge/server errors (5xx+)
            this.status === 520 || // Cloudflare: Unknown Error
            this.status === 521 || // Cloudflare: Web Server Is Down
            this.status === 522 || // Cloudflare: Connection Timed Out
            this.status === 523 || // Cloudflare: Origin Is Unreachable
            this.status === 524    // Cloudflare: A Timeout Occurred
        );
    }
}
