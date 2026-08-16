import type { RpcError as RpcErrorType } from '../../types.js'
import { RpcClientError } from './RpcClientError.js'

/**
 * The provider returned a valid JSON-RPC error envelope for the request.
 *
 * The provider's numeric code, message, and optional data are preserved even
 * when the envelope is returned with a non-successful HTTP status.
 */
export class RpcProviderError extends RpcClientError {
    override readonly name = 'RpcProviderError';
    readonly rpcMessage: string;
    readonly rpcCode: number;
    readonly rpcData?: unknown;

    constructor(args: {
        url: string;
        method: string;
        rpcError: RpcErrorType;
    }) {
        super({
            url: args.url,
            method: args.method,
            message: `RPC error ${args.rpcError.code} for ${args.method}: ${args.rpcError.message}`,
            cause: args.rpcError,
        });
        this.rpcCode = args.rpcError.code;
        this.rpcMessage = args.rpcError.message;
        this.rpcData = args.rpcError.data;
    }

    override get retryable(): boolean {
        const code = Number(this.rpcCode); // Ensure the code is a number

        return (
            code === -32603 || // internal error
            code === -32002 || // resource unavailable
            code === -32005 || // limit exceeded
            code === 429       // rate limit, if provider uses it as RPC code
        );
    }
}
