import type { ConnectionParameters, ConnectOptions, DisconnectOptions } from './connection.types.js';
import { createSocket, getSocketError, type SocketHandle } from './utils/socket.js';
import { WebSocketConnectionError } from './errors/index.js';
import { ConnectionParametersManager } from './connection.params.js';

/**
 * Manages a WebSocket connection and its exact connection boundaries.
 */
export class ConnectionManager {
    /** The parameters for the connection */
    private readonly _parameters: ConnectionParametersManager;
    /** The WebSocket instance */
    private _handle: SocketHandle | null = null;
    /** The promise for the connect operation */
    private _connectPromise: Promise<void> | undefined;
    /** The promise for the disconnect operation */
    private _disconnectPromise: Promise<void> | undefined;
    /** The reject function for the connect operation */
    private _rejectConnect: ((error: Error) => void) | undefined;

    // ==========================
    // Constructor
    // ==========================

    constructor(parameters: ConnectionParameters) {
        this._parameters = new ConnectionParametersManager(parameters);
    }

    // ==========================
    // Public Getters
    // ==========================

    /** Get the WebSocket instance */
    public get socket(): WebSocket | null {
        return this._handle?.socket ?? null;
    }

    /** Check if the WebSocket is connected */
    public get connected(): boolean {
        return this._handle?.socket?.readyState === WebSocket.OPEN;
    }

    // ==========================
    // Public Methods
    // ==========================

    /** Create a WebSocket connection */
    public async connect(options: ConnectOptions = {}): Promise<void> {
        if (this.connected) {
            // Already connected
            return;
        }
        if (this._connectPromise) {
            // Return the promise for the connect operation
            return this._connectPromise;
        }
        if (this._disconnectPromise) {
            // Wait for the disconnect operation to complete
            await this._disconnectPromise;
        }

        const promise = this._createConnection(options);
        this._connectPromise = promise;
        try {
            await promise;
        } finally {
            if (this._connectPromise === promise) {
                this._connectPromise = undefined;
            }
        }
    }

    /** Disconnect the WebSocket connection */
    public async disconnect(options: DisconnectOptions = {}): Promise<void> {
        if (this._disconnectPromise) {
            return this._disconnectPromise; // Already disconnecting
        }

        const handle = this._handle;

        if (!handle) {
            return; // Already disconnected, nothing to do
        }

        const { code, reason, timeout = 1_000 } = options;
        this._handle = null;
        handle.cleanup();

        this._rejectConnect?.(
            new WebSocketConnectionError({ 
                message: 'The WebSocket was disconnected before connecting.' 
            })
        )
        this._rejectConnect = undefined;

        if (handle.socket.readyState === WebSocket.CLOSED) {
            return; // Already closed
        }

        const promise = new Promise<void>((resolve, reject) => {
            const onClose = () => {
                clearTimeout(timer);
                handle.socket.removeEventListener('close', onClose);
                resolve();
            }
            const timer = setTimeout(() => {
                handle.socket.removeEventListener('close', onClose);
                reject(
                    new WebSocketConnectionError({
                        message: `WebSocket disconnection timed out after ${timeout}ms.`
                    })
                )
            }, timeout);

            handle.socket.addEventListener('close', onClose);
            try {
                handle.socket.close(code, reason)
            } catch (error) {
                clearTimeout(timer)
                handle.socket.removeEventListener('close', onClose)
                reject(
                    new WebSocketConnectionError({
                        message: 'WebSocket close failed.',
                        cause: error,
                    })
                )
            }
        });

        this._disconnectPromise = promise;
        try {
            await promise;
        } finally {
            if (this._disconnectPromise === promise) {
                this._disconnectPromise = undefined;
            }
        }
    }

    /** Send a message to the WebSocket */
    public send(data: string): void {
        const socket = this._handle?.socket;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            throw new WebSocketConnectionError({
                message: "The WebSocket is not open."
            });
        }

        socket.send(data);
    }

    // ==========================
    // Private Methods
    // ==========================

    /** Create a WebSocket connection */
    private _createConnection(options: ConnectOptions = {}): Promise<void> {
        const timeout = options.timeout ?? 10_000;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const promise = new Promise<void>((resolve, reject) => {
            let opened = false;
            this._rejectConnect = reject;

            if (this._handle) {
                this._destroyHandle(this._handle);
            }

            let handle: SocketHandle;

            try {
                // Create a WebSocket handle
                handle = createSocket({
                    url: this._parameters.url,
                    protocols: this._parameters.protocols,
                    onOpen: (event: Event) => {
                        if (this._handle?.socket !== handle.socket) {
                            return; // Not our socket
                        }
                        opened = true;
                        this._rejectConnect = undefined;
                        if (timer) clearTimeout(timer)
                        resolve();
                        this._parameters.onOpen?.(event);
                    },
                    onMessage: (event: MessageEvent) => {
                        if (this._handle?.socket !== handle.socket) {
                            return; // Not our socket
                        }
                        this._parameters.onMessage?.(event);
                    },
                    onClose: (event: CloseEvent) => {
                        if (this._handle?.socket !== handle.socket) {
                            return; // Not our socket
                        }
                        if (timer) clearTimeout(timer)
                        this._handle.cleanup();
                        this._handle = null;

                        if (!opened)
                            reject(
                                new WebSocketConnectionError({
                                    message: 'The WebSocket closed before connecting.',
                                }),
                            )
                        this._rejectConnect = undefined;
                        this._parameters.onClose?.(event);
                    },
                    onError: (event: ErrorEvent) => {
                        if (this._handle?.socket !== handle.socket) {
                            return; // Not our socket
                        }
                        const error = getSocketError(event);
                        this._parameters.onError?.(event, error);

                        if (!opened) {
                            if (timer) clearTimeout(timer)
                            this._rejectConnect = undefined
                            reject(
                                new WebSocketConnectionError({
                                    message: 'The WebSocket emitted an error while connecting.',
                                    cause: event,
                                }),
                            )
                        }
                    },
                });
            } catch (error) {
                this._rejectConnect = undefined;
                reject(
                    new WebSocketConnectionError({
                        message: 'WebSocket creation failed.',
                        cause: error,
                    })
                );
                return;
            }

            this._handle = handle;

            timer = setTimeout(() => {
                if (this._handle !== handle) return
                this._rejectConnect = undefined
                const error = new WebSocketConnectionError({
                    message: `WebSocket connection timed out after ${timeout}ms.`,
                })
                void this.disconnect().then(
                    () => reject(error),
                    (disconnectError) =>
                        reject(
                            new WebSocketConnectionError({
                                message: error.message,
                                cause: disconnectError,
                            }),
                        ),
                )
            }, timeout)
        });

        return promise.finally(() => {
            if (timer) {
                clearTimeout(timer)
            }
        });
    }

    /** Destroy the WebSocket handle */
    private _destroyHandle(handle: SocketHandle, code = 1_000, reason = "replaced"): void {
        // Remove the listeners from the socket
        handle.cleanup();

        // Clear the reference to the handle
        if (this._handle === handle) {
            this._handle = null;
        }

        try {
            // Node.js 22 native: terminate() is not needed, close() is sufficient.
            // Listeners have already been removed, so there are no zombie callbacks.
            // The socket will be garbage collected once the close handshake is complete.
            handle.socket.close(code, reason);
        } catch { }
    }
}
