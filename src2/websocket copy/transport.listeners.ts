/**
 * Listeners manager for the WebSocket transport
 */
export class TransportListenersManager {
    public readonly onOpen?: () => void;
    public readonly onClose?: (error: Error) => void;
    public readonly onError?: (error: Error) => void;
    public readonly onMessage?: (data: unknown) => void;

    /**
     * Constructor
     * @param options - The options for the listeners manager configuration
     * @param options.onOpen - The function to call when the WebSocket is opened
     * @param options.onClose - The function to call when the WebSocket is closed
     * @param options.onError - The function to call when the WebSocket emits an error
     * @param options.onMessage - The function to call when the WebSocket receives a message
     */
    constructor(options: {
        onOpen?: () => void;
        onClose?: (error: Error) => void;
        onError?: (error: Error) => void;
        onMessage?: (data: unknown) => void;
    }) {
        this.onOpen = options.onOpen ?? undefined;
        this.onClose = options.onClose ?? undefined;
        this.onError = options.onError ?? undefined;
        this.onMessage = options.onMessage ?? undefined;
    }
}
