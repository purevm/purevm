export class WebSocketProtocolError extends Error {
    public override readonly name = this.constructor.name;
    public readonly raw?: string;

    constructor(args: {
        readonly message: string;
        readonly raw?: string;
        readonly cause?: unknown;
    }) {
        super(args.message, { cause: args.cause });
        this.raw = args.raw;
    }

    public get retryable(): boolean {
        return false;
    }
}
