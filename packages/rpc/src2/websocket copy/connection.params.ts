import type { ConnectionParameters } from './connection.types.js';
import { getWebSocketUrl, type WsUrl, type WssUrl } from './utils/url.js';

/**
 * Parameters manager for the WebSocket connection
 */
export class ConnectionParametersManager {
    /** The URL for the WebSocket */
    public readonly url: WsUrl | WssUrl;
    /** The protocols for the WebSocket */
    public readonly protocols?: string | string[] | WebSocketInit;
    /** The callback for the open event */
    public readonly onOpen?: (event: Event) => void;
    /** The callback for the close event */
    public readonly onClose?: (event: CloseEvent) => void;
    /** The callback for the error event */
    public readonly onError?: (event: ErrorEvent, error: Error) => void;
    /** The callback for the message event */
    public readonly onMessage?: (event: MessageEvent) => void;

    /**
     * Constructor
     * @param parameters - The parameters for the connection
     * @param parameters.url - The URL for the WebSocket
     * @param parameters.protocols - The protocols for the WebSocket
     * @param parameters.onOpen - The function to call when the WebSocket is opened
     * @param parameters.onClose - The function to call when the WebSocket is closed
     * @param parameters.onError - The function to call when the WebSocket emits an error
     * @param parameters.onMessage - The function to call when the WebSocket receives a message
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
