import { RpcClientError } from './RpcClientError.js';

/**
 * The endpoint returned a non-successful HTTP status without a valid
 * JSON-RPC error envelope.
 *
 * A valid JSON-RPC error takes precedence and is represented by
 * {@link RpcProviderError}, even when returned with a 4xx or 5xx status.
 */
export class RpcHttpStatusError extends RpcClientError {
    override readonly name = 'RpcHttpStatusError';
    readonly statusText: string;
    readonly status: number;

    constructor(args: {
        url: string;
        method: string;
        status: number;
        statusText?: string;
        cause?: unknown;
    }) {
        const statusText = args.statusText?.trim() ?? '';

        super({
            url: args.url,
            method: args.method,
            message: `HTTP ${args.status} ${statusText ? statusText : 'error'} for ${args.method}`,
            cause: args.cause,
        });

        this.status = args.status;
        this.statusText = statusText;
    }

    override get retryable(): boolean {
        return (
            this.status === 408 ||
            this.status === 429 ||
            this.status === 500 ||
            this.status === 502 ||
            this.status === 503 ||
            this.status === 504
        );
    }
}
