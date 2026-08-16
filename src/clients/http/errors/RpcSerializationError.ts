/**
 * The JSON-RPC request envelope could not be serialized before transmission.
 *
 * This commonly results from circular values or values unsupported by JSON.stringify, such as BigInt.
 */
export class RpcSerializationError extends Error {
    override readonly name = this.constructor.name;

    constructor(args: {
        cause?: unknown;
    }) {
        super(`Failed to serialize JSON-RPC request.`, {
            cause: args.cause 
        });
    }

    get retryable(): boolean {
        return false;
    }
}
