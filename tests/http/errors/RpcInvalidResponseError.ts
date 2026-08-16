import { RpcClientError } from './RpcClientError.js'

/**
 * The response body was valid JSON but was neither a valid JSON-RPC success
 * envelope nor a valid JSON-RPC error envelope.
 *
 * Invalid JSON syntax is represented by {@link RpcParseError}, while a valid
 * envelope with the wrong ID is represented by {@link RpcIdMismatchError}.
 */
export class RpcInvalidResponseError extends RpcClientError {
    override readonly name = 'RpcInvalidResponseError';
    readonly response: unknown;

    constructor(args: {
        url: string;
        method: string;
        response: unknown;
        cause?: unknown;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `Invalid JSON-RPC response for ${args.method}`,
            cause: args.cause,
        });
        this.response = args.response;
    }

    override get retryable(): boolean {
        return false;
    }
}
