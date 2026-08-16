/**
 * Parameters for the WebSocket transport
 */
export type TransporListenersParameters = {
    /** Callback for the open event */
    onOpen?: () => void
    /** Callback for the close event */
    onClose?: (error: Error) => void
    /** Callback for the error event */
    onError?: (error: Error) => void
    /** Callback for the message event */
    onMessage?: (data: unknown) => void
}

/**
 * Reconnect options for the WebSocket transport
 */
export type TransportReconnectParameters = {
    /** Minimum delay for the reconnect */
    minDelay?: number
    /** Maximum delay for the reconnect */
    maxDelay?: number
    /** Factor for the reconnect */
    factor?: number
    /** Jitter for the reconnect */
    jitter?: number
}

/**
 * Options for the WebSocket transport
 */
export type TransportParameters = TransporListenersParameters & {
    /** URL for the WebSocket */
    url: string
    /** Protocols for the WebSocket */
    protocols?: string | string[]
    /** Connection timeout for the WebSocket */
    connectionTimeout?: number
    /** Disconnection timeout for the WebSocket */
    disconnectionTimeout?: number
    /** Reconnect options for the WebSocket */
    reconnect?: TransportReconnectParameters
}
