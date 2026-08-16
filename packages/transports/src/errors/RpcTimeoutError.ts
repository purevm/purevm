/**
 * The configured client deadline elapsed before the complete response was read.
 *
 * This is a client-enforced timeout, not an explicit caller cancellation or an
 * HTTP timeout status returned by the endpoint.
 */
export class RpcTimeoutError extends Error {
    override readonly name = this.constructor.name;

    constructor(args: {
        timeout: number;
        cause?: unknown;
    }) {
        super(`Request timed out after ${args.timeout}ms.`, {
            cause: args.cause 
        });
    }

    get retryable(): boolean {
        return true;
    }
}
