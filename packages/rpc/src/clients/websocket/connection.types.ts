/**
 * Listeners for the WebSocket connection
 */
export type ConnectionListeners = {
    /** Callback for the open event */
    onOpen: (event: Event) => void;
    /** Callback for the close event */
    onClose: (event: CloseEvent) => void;
    /** Callback for the error event */
    onError: (event: Event | ErrorEvent, error: Error) => void;
    /** Callback for the message event */
    onMessage: (event: MessageEvent) => void;
};

/**
 * Parameters for the Connection class
 */
export type ConnectionParameters = ConnectionListeners & {
    /** URL for the WebSocket */
    url: string;
    /** Protocols for the WebSocket */
    protocols?: string | string[] | undefined;
};

/** 
 * Options for the connect function 
 */
export type ConnectOptions = {
    /** Timeout for the connect function */
    timeout?: number;
};

/**
 * Options for the disconnect function
 */
export type DisconnectOptions = {
    /** Code for the disconnect function */
    code?: number;
    /** Reason for the disconnect function */
    reason?: string;
    /** Timeout for the disconnect function */
    timeout?: number;
};
