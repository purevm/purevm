export class RpcTimeoutError extends Error {
    public override readonly name = this.constructor.name;
    public readonly timeout: number;

    constructor(args: {
        readonly timeout: number;
        readonly method?: string;
        readonly cause?: unknown;
    }) {
        super(
            `${args.method ?? "WebSocket request"} timed out after ${args.timeout}ms.`,
            { cause: args.cause },
        );
        this.timeout = args.timeout;
    }
}
