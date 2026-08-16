/**
 * The endpoint returned a successful HTTP response whose body could not be parsed as JSON.
 *
 * A non-successful HTTP response with a non-JSON body is represented by {@link RpcHttpStatusError}.
 */
export class RpcParseBodyError extends Error {
    override readonly name = this.constructor.name;

    constructor(args: {
        cause?: unknown;
        body?: string;
    }) {
        super(`Failed to parse response body as JSON`, {
            cause: args.cause 
        });
    }

    get retryable(): boolean {
        return false;
    }
}
