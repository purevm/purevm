import { RpcClientError } from './RpcClientError.js'

/**
 * The endpoint returned a successful HTTP response whose body could not be
 * parsed as JSON.
 *
 * A non-successful HTTP response with a non-JSON body is represented by
 * {@link RpcHttpStatusError}.
 */
export class RpcParseError extends RpcClientError {
    override readonly name = 'RpcParseError';

    constructor(args: {
        url: string;
        method: string;
        cause?: unknown;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `Failed to parse JSON response for ${args.method}`,
            cause: args.cause,
        });
    }

    override get retryable(): boolean {
        return false;
    }
}
