import { WebSocketConnectionError, WebSocketStoppedError } from './errors2.js';
import { TransportReconnectManager } from './transport.lifecycle.js';
import { TransportListenersManager } from './transport.listeners.js';
import { ConnectionManager } from './connection.js';


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
    onOpen?: () => void
    onClose?: (error: Error) => void
    onError?: (error: Error) => void
    onMessage?: (data: unknown) => void
}

export class WebSocketTransport {
    private readonly connector: ConnectionManager
    private readonly reconnect: TransportReconnectManager
    private readonly listeners: TransportListenersManager

    private readonly connectionTimeout: number
    private readonly disconnectionTimeout: number

    private connectPromise: Promise<void> | undefined
    private disconnectPromise: Promise<void> | undefined

    private _stopped = false
    private _active = false

    constructor(options: WebSocketTransportOptions) {
        this.reconnect = new TransportReconnectManager(options.reconnect);
        this.listeners = new TransportListenersManager(options);

        this.connectionTimeout = options.connectionTimeout ?? 10_000
        this.disconnectionTimeout = options.disconnectionTimeout ?? 1_000

        this.connector = new ConnectionManager({
            url: options.url,
            protocols: options.protocols,
            onOpen: () => {
                this.reconnect.reset();
                this.listeners.onOpen?.()
            },
            onClose: (event) => {
                void this.disconnect(
                    new WebSocketConnectionError(
                        `The WebSocket connection closed with code ${event.code}${event.reason ? `: ${event.reason}` : '.'
                        }`,
                    ),
                    true,
                )
            },
            onError: (error) => {
                const connectionError = toConnectionError(
                    error,
                    'The WebSocket emitted an error.',
                )
                this.listeners.onError?.(connectionError)
                void this.disconnect(connectionError, true)
            },
            onMessage: (data) => this.listeners.onMessage?.(data),
        })
    }

    // ================================
    // Public Getters
    // ================================

    get connected() {
        return this.connector.connected;
    }

    // ================================
    // Public Methods
    // ================================

    async start() {
        this._stopped = false;
        this.reconnect.enable();
        this.reconnect.cancel();
        await this.connect();
    }

    async send(data: string) {
        if (this._stopped) {
            throw new WebSocketStoppedError();
        }
        this.reconnect.enable();

        if (!this.connected) {
            // If the connection is not established, establish it
            await this.connect();
        }

        try {
            this.connector.send(data);
        } catch (error) {
            const connectionError = toConnectionError(error, 'WebSocket send failed.');
            await this.disconnect(connectionError, true);
            throw connectionError;
        }
    }

    async restart() {
        if (this._stopped) {
            throw new WebSocketStoppedError();
        }

        this.reconnect.enable();
        this.reconnect.cancel();

        if (this._active)
            await this.disconnect(
                new WebSocketConnectionError('The WebSocket was restarted.'),
                false,
            )
        await this.connect();
    }

    async stop() {
        this._stopped = true;
        this.reconnect.disable();

        const error = new WebSocketStoppedError();
        if (this._active) await this.disconnect(error, false);
        else this.listeners.onClose?.(error);
    }

    // ================================
    // Private Methods
    // ================================

    private async connect() {
        if (this._stopped) throw new WebSocketStoppedError();
        if (this.connected) return;
        if (this.connectPromise) return this.connectPromise;
        if (this.disconnectPromise) await this.disconnectPromise;
        
        this._active = true;

        const promise = this.connector
            .connect({ timeout: this.connectionTimeout })
            .catch(async (error) => {
                const connectionError = toConnectionError(
                    error,
                    'WebSocket connection failed.',
                )
                if (this._active) {
                    this.listeners.onError?.(connectionError)
                    await this.disconnect(connectionError, true)
                }
                throw connectionError
            });

        this.connectPromise = promise;
        try {
            await promise;
        } finally {
            if (this.connectPromise === promise) {
                this.connectPromise = undefined;
            }
        }
    }

    private async disconnect(error: Error, shouldReconnect: boolean) {
        if (this.disconnectPromise) return this.disconnectPromise
        if (!this._active) return

        this._active = false

        const promise = (async () => {
            let failure: WebSocketConnectionError | undefined
            try {
                await this.connector.disconnect({
                    timeout: this.disconnectionTimeout,
                })
            } catch (disconnectError) {
                failure = toConnectionError(
                    disconnectError,
                    'WebSocket disconnection failed.',
                )
                this.listeners.onError?.(failure)
            }

            this.listeners.onClose?.(error)
            if (
              shouldReconnect &&
              this.reconnect.schedule(() => this.connect())
            )
            if (failure && !shouldReconnect) throw failure
        })()

        this.disconnectPromise = promise
        try {
            await promise
        } finally {
            if (this.disconnectPromise === promise)
                this.disconnectPromise = undefined
        }
    }
}

function toConnectionError(error: unknown, message: string) {
    if (error instanceof WebSocketConnectionError) return error
    if (error instanceof Error)
        return new WebSocketConnectionError(message, { cause: error })
    return new WebSocketConnectionError(message, { cause: error })
}
