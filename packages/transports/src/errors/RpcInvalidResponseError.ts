/**
 * The response body was valid JSON but was neither a valid JSON-RPC success envelope nor a valid JSON-RPC error envelope.
 *
 * Invalid JSON syntax is represented by {@link RpcParseError}, while a valid
 * envelope with the wrong ID is represented by {@link RpcIdMismatchError}.
 */
export class RpcInvalidResponseError extends Error {
    override readonly name = this.constructor.name;
    readonly response: unknown;

    constructor(args: {
        response: unknown;
        cause?: unknown;
    }) {
        super(`Invalid JSON-RPC response`, {
            cause: args.cause 
        });
        this.response = args.response;
    }

    get retryable(): boolean {
        return false;
    }
}
