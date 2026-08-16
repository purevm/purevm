export class RpcAbortError extends Error {
    public override readonly name = this.constructor.name;

    constructor(args: { readonly cause?: unknown } = {}) {
        super("WebSocket request was aborted.", { cause: args.cause });
    }

    public get retryable(): boolean {
        return false;
    }
}
