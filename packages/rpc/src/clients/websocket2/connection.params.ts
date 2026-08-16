import type { ConnectionParameters } from './connection.types.js';
import { getWebSocketUrl, type WsUrl, type WssUrl } from './utils/url.js';

/**
 * Parameters manager for the WebSocket connection
 */
export class ConnectionParametersManager {
    public readonly url: WsUrl | WssUrl;
    public readonly protocols?: string | string[] | undefined;
    
    public readonly onOpen: (event: Event) => void;
    public readonly onClose: (event: CloseEvent) => void;
    public readonly onError: (event: Event | ErrorEvent, error: Error) => void;
    public readonly onMessage: (event: MessageEvent) => void;

    /**
     * Constructor
     * @param parameters - Connection parameters for the WebSocket (see {@link ConnectionParameters})
     */
    constructor(parameters: ConnectionParameters) {
        this.url = getWebSocketUrl(parameters.url);
        this.protocols = parameters.protocols;

        this.onOpen = parameters.onOpen;
        this.onClose = parameters.onClose;
        this.onError = parameters.onError;
        this.onMessage = parameters.onMessage;
    }
}
