import type { JsonRpcRequest, JsonRpcResponse } from '../types.js';

/**
 * The endpoint returned a valid JSON-RPC envelope whose ID does not match the outgoing request ID.
 *
 * This prevents a response from being associated with the wrong request.
 */
export class RpcIdMismatchError extends Error {
    override readonly name = this.constructor.name;
    readonly expectedId: JsonRpcRequest['id'];
    readonly responseId: JsonRpcResponse['id'];
    readonly response: unknown;

    constructor(args: {
        expectedId: JsonRpcRequest['id'];
        responseId: JsonRpcResponse['id'];
        response: unknown;
        cause?: unknown;
    }) {
        super(`JSON-RPC response ID mismatch: expected ${String(args.expectedId)}, got ${String(args.responseId)}`, {
            cause: args.cause 
        });
        this.expectedId = args.expectedId;
        this.responseId = args.responseId;
        this.response = args.response;
    }

    get retryable(): boolean {
        return false;
    }
}
