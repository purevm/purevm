
export type WebSocketTransportOptions = {
    url: string
    protocols?: string | string[]
    connectionTimeout?: number
    disconnectionTimeout?: number
    reconnect?: {
        minDelay?: number
        maxDelay?: number
        factor?: number
        jitter?: number
    }
    onError?: (error: Error) => void
}

export type ListenerMap = {
    open: () => void
    close: (error: Error) => void
    error: (error: Error) => void
    message: (data: unknown) => void
}
