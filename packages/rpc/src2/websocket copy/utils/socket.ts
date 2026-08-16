// ===========================================================
// Types
// ===========================================================

export type SocketOptions = {
    /** URL for the WebSocket */
    url: string;
    /** Protocols for the WebSocket */
    protocols?: string | string[] | WebSocketInit;
    /** Callback for the open event */
    onOpen: (event: Event) => void;
    /** Callback for the message event */
    onMessage: (event: MessageEvent) => void;
    /** Callback for the close event */
    onClose: (event: CloseEvent) => void;
    /** Callback for the error event */
    onError: (event: ErrorEvent) => void;
}

export type SocketHandle = {
    /** WebSocket connection */
    socket: WebSocket;
    /** Cleanup the WebSocket connection */
    cleanup: () => void;
}

// ===========================================================
// Functions
// ===========================================================

/**
 * Creates a WebSocket and attaches its event listeners.
 */
export function createSocket(options: SocketOptions): SocketHandle {
    const { url, onOpen, onClose, onError, onMessage } = options;
    const socket = new WebSocket(url);

    const handleOpen = (event: Event) => onOpen(event);
    const handleClose = (event: CloseEvent) => onClose(event);
    const handleError = (event: ErrorEvent) => onError(event);
    const handleMessage = (event: MessageEvent) => onMessage(event.data);

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', handleError);
    socket.addEventListener('message', handleMessage);

    return {
        socket,
        cleanup() {
            socket.removeEventListener('open', handleOpen);
            socket.removeEventListener('close', handleClose);
            socket.removeEventListener('error', handleError);
            socket.removeEventListener('message', handleMessage);
        },
    };
}

/**
 * Gets the error from a WebSocket error event.
 */
export function getSocketError(event: Event | ErrorEvent): Error {
    const error = (event as Partial<ErrorEvent>).error;

    if (error instanceof Error) {
        return error;
    }

    if (typeof error === "string") {
        return new Error(error);
    }

    const message = (event as Partial<ErrorEvent>).message;

    if (typeof message === "string" && message.length > 0) {
        return new Error(message);
    }

    return new Error("WebSocket error");
}