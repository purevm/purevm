import type { RpcRequest, RpcResponse } from '../../types.js';
import { RpcClientError } from './RpcClientError.js';

/**
 * The endpoint returned a valid JSON-RPC envelope whose ID does not match
 * the outgoing request ID.
 *
 * This prevents a response from being associated with the wrong request.
 */
export class RpcIdMismatchError extends RpcClientError {
    override readonly name = 'RpcIdMismatchError';
    readonly expectedId: RpcRequest['id'];
    readonly responseId: RpcResponse['id'];
    readonly response: unknown;

    constructor(args: {
        url: string;
        method: string;
        expectedId: RpcRequest['id'];
        responseId: RpcResponse['id'];
        response: unknown;
        cause?: unknown;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `RPC id mismatch for ${args.method}: expected ${String(args.expectedId)}, got ${String(args.responseId)}`,
            cause: args.cause,
        });

        this.expectedId = args.expectedId;
        this.responseId = args.responseId;
        this.response = args.response;
    }

    override get retryable(): boolean {
        return false;
    }
}
