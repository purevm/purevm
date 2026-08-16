export class UnsubscribeError extends Error {
    public override readonly name = this.constructor.name;

    constructor(args: {
        readonly message: string;
        readonly cause?: unknown;
    }) {
        super(args.message, { cause: args.cause });
    }
}
