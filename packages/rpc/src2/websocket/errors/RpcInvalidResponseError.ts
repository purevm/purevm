export class RpcInvalidResponseError extends Error {
    public override readonly name = this.constructor.name;
    public readonly response: unknown;

    constructor(args: {
        readonly response: unknown;
        readonly cause?: unknown;
    }) {
        super("Invalid WebSocket JSON-RPC response.", { cause: args.cause });
        this.response = args.response;
    }

    public get retryable(): boolean {
        return false;
    }
}
