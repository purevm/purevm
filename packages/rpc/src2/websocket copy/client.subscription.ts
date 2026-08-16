import {
    JsonRpcResponseError,
    RpcRequestTimeoutError,
    WebSocketConnectionError,
    WebSocketStoppedError,
    type JsonRpcErrorObject,
} from './errors2.js'
import {
    type WebSocketTransportOptions,
} from './transport.js'

import type { WebSocketRequestManager } from './client.request.js'
import type { JsonRpcRequest, JsonRpcSubscriptionNotification, SubscribeOptions } from './client.types.js'
import { isSubscriptionParams } from './utils/guards.js'

export type WebSocketClientOptions = Omit<
    WebSocketTransportOptions,
    'onOpen' | 'onClose' | 'onError' | 'onMessage'
> & {
    requestTimeout?: number
    onError?: (error: Error) => void
}

type WebSocketSubscriptionManagerOptions = {
    requests: WebSocketRequestManager
    start: () => Promise<void>
    connected: () => boolean
    onError?: ((error: Error) => void) | undefined
}

type ActiveSubscription = SubscribeOptions<any>

export class WebSocketSubscriptionManager {
    private readonly requests: WebSocketRequestManager
    private readonly start: () => Promise<void>
    private readonly connected: () => boolean
    private readonly onError: ((error: Error) => void) | undefined

    private subscription: ActiveSubscription | undefined
    private subscriptionId: string | undefined
    private activationPromise: Promise<void> | undefined

    constructor(options: WebSocketSubscriptionManagerOptions) {
        this.requests = options.requests
        this.start = options.start
        this.connected = options.connected
        this.onError = options.onError
    }

    get identifier() {
        return this.subscriptionId;
    }

    async subscribe<result = unknown>(options: SubscribeOptions<result>) {
        if (this.subscription)
            throw new WebSocketConnectionError(
                'This client already has a subscription. Create another client for another subscription.',
            )

        this.subscription = options
        try {
            await this.start();
            await this.activate();
        } catch (error) {
            if (this.subscription === options) {
                this.subscription = undefined;
            }
            throw error;
        }

        return () => this.unsubscribe()
    }

    async unsubscribe() {
        const subscription = this.subscription;
        const subscriptionId = this.subscriptionId;

        this.subscription = undefined;
        this.subscriptionId = undefined;

        if (!subscription) {
            // If there is no subscription, there is nothing to unsubscribe
            return false;
        }

        if (this.activationPromise) {
            // If the subscription is still being activated, wait for it to complete
            await this.activationPromise.catch(() => { });
        }

        if (!subscriptionId || !this.connected()) {
            // If the subscription is not active, there is nothing to unsubscribe
            return false;
        }

        return this.requests.request<boolean>({
            method: 'eth_unsubscribe',
            params: [subscriptionId],
        });
    }

    async activate() {
        const subscription = this.subscription
        if (!subscription || this.subscriptionId) return
        if (this.activationPromise) return this.activationPromise

        const promise = (async () => {
            try {
                const request: JsonRpcRequest = {
                    method: 'eth_subscribe',
                    params: subscription.params,
                    timeout: subscription.timeout,
                }
                const subscriptionId = await this.requests.request<unknown>(request)
                if (typeof subscriptionId !== 'string')
                    throw new WebSocketConnectionError(
                        'eth_subscribe returned an invalid subscription identifier.',
                    )

                if (this.subscription !== subscription) {
                    if (this.connected())
                        void this.requests
                            .request({
                                method: 'eth_unsubscribe',
                                params: [subscriptionId],
                            })
                            .catch(() => { })
                    return
                }
                this.subscriptionId = subscriptionId
            } catch (error) {
                this.reportError(error)
                throw error
            }
        })()

        this.activationPromise = promise
        try {
            await promise
        } finally {
            if (this.activationPromise === promise)
                this.activationPromise = undefined
        }
    }

    handleMessage(message: Record<string, any>) {
        if (
            message['method'] !== 'eth_subscription' ||
            !isSubscriptionParams(message['params'])
        )
            return false

        if (
            message['params']['subscription'] !== this.subscriptionId ||
            !this.subscription
        )
            return true

        const notification =
            message as JsonRpcSubscriptionNotification<unknown>
        try {
            this.subscription.onData(notification.params.result, notification)
        } catch (error) {
            this.reportError(error)
        }
        return true
    }

    handleClose() {
        this.subscriptionId = undefined
    }

    clear() {
        this.subscription = undefined
        this.subscriptionId = undefined
    }

    private reportError(error: unknown) {
        const value =
            error instanceof Error
                ? error
                : new WebSocketConnectionError('Unknown subscription error.', {
                    cause: error,
                })
        this.subscription?.onError?.(value)
        this.onError?.(value)
    }
}
