import { RpcClientError } from './RpcClientError.js';

/**
 * The caller explicitly cancelled the request before its response was fully read.
 *
 * Client-enforced request deadlines are represented by {@link RpcTimeoutError}.
 */
export class RpcAbortError extends RpcClientError {
    override readonly name = 'RpcAbortError';

    constructor(args: {
        url: string;
        method: string;
        cause?: unknown;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `Request aborted for ${args.method}`,
            cause: args.cause,
        });
    }

    override get retryable(): boolean {
        return false;
    }
}
