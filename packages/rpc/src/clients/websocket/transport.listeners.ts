import type { TransporListenersParameters } from './transport.types.js';

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
     * @param options - Listener options for the WebSocket transport (see {@link TransporListenersParameters})
     */
    constructor(options: TransporListenersParameters) {
        this.onOpen = options.onOpen ?? undefined;
        this.onClose = options.onClose ?? undefined;
        this.onError = options.onError ?? undefined;
        this.onMessage = options.onMessage ?? undefined;
    }
}
