import { RpcClientError } from './RpcClientError.js';

/**
 * The JSON-RPC request envelope could not be serialized before transmission.
 *
 * This commonly results from circular values or values unsupported by
 * JSON.stringify, such as BigInt.
 */
export class RpcSerializationError extends RpcClientError {
    override readonly name = 'RpcSerializationError';

    constructor(args: {
        url: string;
        method: string;
        cause?: unknown;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `Failed to serialize JSON-RPC request for ${args.method}`,
            cause: args.cause,
        });
    }

    override get retryable(): boolean {
        return false;
    }
}
