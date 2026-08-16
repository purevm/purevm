/**
 * The request or response body stream failed because of an underlying network
 * or transport problem, leaving no complete response to process.
 *
 * Examples include DNS failures, refused connections, and interrupted sockets.
 */
export class RpcNetworkError extends Error {
    override readonly name = this.constructor.name;

    constructor(args: {
        cause?: unknown;
    }) {
        super(`Network request failed`, {
            cause: args.cause 
        });
    }

    get retryable(): boolean {
        return true;
    }
}
