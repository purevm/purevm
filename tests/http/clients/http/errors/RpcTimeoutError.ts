import { RpcClientError } from './RpcClientError.js'

/**
 * The configured client deadline elapsed before the complete response was read.
 *
 * This is a client-enforced timeout, not an explicit caller cancellation or an
 * HTTP timeout status returned by the endpoint.
 */
export class RpcTimeoutError extends RpcClientError {
    override readonly name = 'RpcTimeoutError';
    readonly timeoutMs: number;

    constructor(args: {
        url: string;
        method: string;
        timeoutMs: number;
        cause?: unknown;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `Timeout after ${args.timeoutMs}ms for ${args.method}`,
            cause: args.cause,
        });

        this.timeoutMs = args.timeoutMs;
    }

    override get retryable(): boolean {
        return true;
    }
}
