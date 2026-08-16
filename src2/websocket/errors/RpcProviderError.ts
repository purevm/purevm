import type { JsonRpcErrorObject } from "../types.js";

export class RpcProviderError extends Error {
    public override readonly name = this.constructor.name;
    public readonly rpcCode: number;
    public readonly rpcMessage: string;
    public readonly rpcData?: unknown;

    constructor(args: { readonly error: JsonRpcErrorObject }) {
        super(`RPC error ${args.error.code}: ${args.error.message}`, {
            cause: args.error,
        });
        this.rpcCode = args.error.code;
        this.rpcMessage = args.error.message;
        this.rpcData = args.error.data;
    }

    public get retryable(): boolean {
        return (
            this.rpcCode === -32603 ||
            this.rpcCode === -32002 ||
            this.rpcCode === -32005 ||
            this.rpcCode === 429
        );
    }
}
