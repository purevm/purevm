import { RpcClientError } from './RpcClientError.js';

/**
 * The request or response body stream failed because of an underlying network
 * or transport problem, leaving no complete response to process.
 *
 * Examples include DNS failures, refused connections, and interrupted sockets.
 */
export class RpcNetworkError extends RpcClientError {
    override readonly name = 'RpcNetworkError';

    constructor(args: {
        url: string;
        method: string;
        cause?: unknown;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `Network request failed for ${args.method}`,
            cause: args.cause,
        });
    }

    override get retryable(): boolean {
        return true;
    }
}
