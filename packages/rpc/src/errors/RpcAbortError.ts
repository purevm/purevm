/**
 * The caller explicitly cancelled the request before its response was fully read.
 *
 * Client-enforced request deadlines are represented by {@link RpcTimeoutError}.
 */
export class RpcAbortError extends Error {
    override readonly name = this.constructor.name;

    constructor(args: {
        cause?: unknown;
    }) {
        super(`Request was aborted.`, {
            cause: args.cause 
        });
    }

    get retryable(): boolean {
        return false;
    }
}
