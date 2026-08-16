import type { JsonRpcErrorObject } from '../types.js';

/**
 * The provider returned a valid JSON-RPC error envelope for the request.
 *
 * The provider's numeric code, message, and optional data are preserved even
 * when the envelope is returned with a non-successful HTTP status.
 */
export class RpcProviderError extends Error {
    override readonly name = this.constructor.name;

    readonly rpcMessage: string;
    readonly rpcCode: number;
    readonly rpcData?: unknown;

    constructor(args: {
        error: JsonRpcErrorObject;
    }) {
        super(`RPC error ${args.error.code}: ${args.error.message}`, {
            cause: args.error 
        });
        this.rpcCode = args.error.code;
        this.rpcMessage = args.error.message;
        this.rpcData = args.error.data;
    }

    get retryable(): boolean {
        return (
            this.rpcCode === -32603 || // internal error
            this.rpcCode === -32002 || // resource unavailable
            this.rpcCode === -32005 || // limit exceeded
            this.rpcCode === 429       // rate limit, if provider uses it as RPC code
        );
    }
}
