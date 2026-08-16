/**
 * Error class for WebSocket connection errors
 */
export class WebSocketConnectionError extends Error {
    override readonly name = this.constructor.name;

    constructor(args: {
        readonly message: string;
        readonly cause?: unknown;
    }) {
        super(args.message, { cause: args.cause });
    }
}
