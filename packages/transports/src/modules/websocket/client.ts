import {
    RpcInvalidResponseError,
    RpcTimeoutError,
    WebSocketConnectionError,
    WebSocketStoppedError,
} from './errors/index.js'
import {
    WebSocketTransport,
    type WebSocketTransportOptions,
} from './WebSocketTransport.js'

import type { WebSocketRequestManager } from './client.request.js'
import type { WebSocketSubscriptionManager } from './client.subscription.js'

import type { JsonRpcId, JsonRpcRequest, JsonRpcResponse, JsonRpcSubscriptionNotification } from './client.types.js'
import { isRecord } from './utils/guards.js'
import { isSubscriptionParams } from './utils/guards.js'


export type SubscribeOptions<result = unknown> = {
    params: SubscriptionParameters
    onData: (
        result: result,
        message: JsonRpcSubscriptionNotification<result>,
    ) => void
    onError?: (error: Error) => void
    timeout?: number
}

export type WebSocketClientOptions = Omit<
    WebSocketTransportOptions,
    'onOpen' | 'onClose' | 'onError' | 'onMessage'
> & {
    requestTimeout?: number
    onError?: (error: Error) => void
}

export class WebSocketClientManager {
    readonly transporter: WebSocketTransport
    readonly requester: WebSocketRequestManager
    readonly subscriber: WebSocketSubscriptionManager
    private readonly onError: ((error: Error) => void) | undefined

    constructor(options: WebSocketClientOptions) {
        const { requestTimeout = 10_000, onError, ...transportOptions } = options
        this.onError = onError

        let transport: WebSocketTransport
        const requests = new WebSocketRequestManager({
            timeout: requestTimeout,
            send: (data) => transport.send(data),
        })
        const subscriptions = new WebSocketSubscriptionManager({
            requests,
            start: () => transport.start(),
            connected: () => transport.connected,
            onError,
        })

        transport = new WebSocketTransport({
            ...transportOptions,
            onMessage: (data) => {
                void this.handleMessage(data)
            },
            onOpen: () => {
                void subscriptions.activate().catch(() => { })
            },
            onClose: (error) => {
                subscriptions.handleClose()
                requests.rejectPending(error)
            },
            onError: (error) => this.onError?.(error),
        })

        this.requester = requests
        this.subscriber = subscriptions
        this.transporter = transport
    }

    get connected() {
        return this.transporter.connected
    }

    get subscriptionIdentifier() {
        return this.subscriber.identifier
    }

    async start() {
        return this.transporter.start();
    }

    request<result = unknown>(request: JsonRpcRequest): Promise<result> {
        return this.requester.request<result>(request);
    }

    async subscribe<result = unknown>(options: SubscribeOptions<result>) {
        return this.subscriber.subscribe(options);
    }

    async unsubscribe() {
        return this.subscriber.unsubscribe();
    }

    async restart() {
        await this.transporter.restart()
        await this.subscriber.activate()
    }

    async stop() {
        this.subscriber.clear()
        await this.transporter.stop()
        this.requester.rejectPending(new WebSocketStoppedError());
    }

    private async handleMessage(data: unknown) {
        let message: unknown
        try {
            const string = await this._messageToString(data);
            message = JSON.parse(string);
        } catch (error) {
            this.onError?.(
                new WebSocketConnectionError('Received an invalid JSON-RPC message.', {
                    cause: error,
                }),
            )
            return
        }

        if (!isRecord(message)) return

        if (
            message["method"] === 'eth_subscription' &&
            isSubscriptionParams(message["params"])
        ) {
            this.subscriber.handleMessage(message);
            return
        }

        this.requester.handleResponse(message as any);
    }

    // ===========================
    // Private Methods
    // ===========================

    /**
     * Converts a WebSocket message to a string.
     */
    private async _messageToString(data: unknown): Promise<string> {
        if (typeof data === 'string') {
            return data; // Already a string
        }
        if (data instanceof ArrayBuffer) {
            const uint8Array = new Uint8Array(data);
            return new TextDecoder().decode(uint8Array);
        }
        if (ArrayBuffer.isView(data)) {
            const uint8Array = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            return new TextDecoder().decode(uint8Array);
        }
        if (typeof Blob !== 'undefined' && data instanceof Blob) {
            return data.text();
        }
        throw new TypeError('Unsupported WebSocket message type.')
    }
}
