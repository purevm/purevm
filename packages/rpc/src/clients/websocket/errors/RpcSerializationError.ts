export class RpcSerializationError extends Error {
    public override readonly name = this.constructor.name;

    constructor(args: { readonly cause?: unknown } = {}) {
        super("Failed to serialize WebSocket JSON-RPC request.", {
            cause: args.cause,
        });
    }

    public get retryable(): boolean {
        return false;
    }
}
