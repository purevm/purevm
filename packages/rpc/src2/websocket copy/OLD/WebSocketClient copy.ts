import {
  JsonRpcResponseError,
  RpcRequestTimeoutError,
  WebSocketConnectionError,
  WebSocketStoppedError,
  type JsonRpcErrorObject,
} from '../errors.js'
import {
  WebSocketTransport,
  type WebSocketTransportOptions,
} from './WebSocketTransport.js'

export type JsonRpcId = number | string

export type JsonRpcResponse<result = unknown> = {
  jsonrpc: '2.0'
  id: JsonRpcId
  result?: result
  error?: JsonRpcErrorObject
}

export type JsonRpcSubscriptionNotification<result = unknown> = {
  jsonrpc: '2.0'
  method: 'eth_subscription'
  params: {
    subscription: string
    result: result
  }
}

export type RpcRequest = {
  method: string
  params?: readonly unknown[]
  timeout?: number
}

export type SubscriptionParameters = readonly [string, ...unknown[]]

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

type PendingRequest = {
  method: string
  resolve: (result: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

type ActiveSubscription = SubscribeOptions<any>

export class WebSocketClient {
  readonly transport: WebSocketTransport

  private readonly requestTimeout: number
  private readonly onError: ((error: Error) => void) | undefined
  private readonly pending = new Map<JsonRpcId, PendingRequest>()
  private nextId = 0
  private subscription: ActiveSubscription | undefined
  private subscriptionId: string | undefined
  private subscriptionPromise: Promise<void> | undefined

  constructor(options: WebSocketClientOptions) {
    const { requestTimeout = 10_000, onError, ...transportOptions } = options
    this.requestTimeout = requestTimeout
    this.onError = onError
    this.transport = new WebSocketTransport({
      ...transportOptions,
      onMessage: (data) => {
        void this.handleMessage(data)
      },
      onOpen: () => {
        void this.activateSubscription().catch(() => {})
      },
      onClose: (error) => {
        this.subscriptionId = undefined
        this.rejectPending(error)
      },
      onError: (error) => this.onError?.(error),
    })
  }

  get connected() {
    return this.transport.connected
  }

  get subscriptionIdentifier() {
    return this.subscriptionId
  }

  async start() {
    await this.transport.start()
  }

  async request<result = unknown>({
    method,
    params = [],
    timeout,
  }: RpcRequest): Promise<result> {
    return this.sendRequest(method, params, timeout) as Promise<result>
  }

  async subscribe<result = unknown>(options: SubscribeOptions<result>) {
    if (this.subscription)
      throw new WebSocketConnectionError(
        'This client already has a subscription. Create another client for another subscription.',
      )

    this.subscription = options
    try {
      await this.transport.start()
      await this.activateSubscription()
    } catch (error) {
      if (this.subscription === options) this.subscription = undefined
      throw error
    }

    return () => this.unsubscribe()
  }

  async unsubscribe() {
    const subscription = this.subscription
    const subscriptionId = this.subscriptionId
    this.subscription = undefined
    this.subscriptionId = undefined

    if (!subscription) return false

    if (this.subscriptionPromise)
      await this.subscriptionPromise.catch(() => {})

    if (!subscriptionId || !this.transport.connected) return false
    return this.request<boolean>({
      method: 'eth_unsubscribe',
      params: [subscriptionId],
    })
  }

  async restart() {
    await this.transport.restart()
    await this.activateSubscription()
  }

  async stop() {
    this.subscription = undefined
    this.subscriptionId = undefined
    await this.transport.stop()
    this.rejectPending(new WebSocketStoppedError())
  }

  private async activateSubscription() {
    const subscription = this.subscription
    if (!subscription || this.subscriptionId) return
    if (this.subscriptionPromise) return this.subscriptionPromise

    const promise = (async () => {
      try {
        const subscriptionId = await this.sendRequest(
          'eth_subscribe',
          subscription.params,
          subscription.timeout,
        )
        if (typeof subscriptionId !== 'string')
          throw new WebSocketConnectionError(
            'eth_subscribe returned an invalid subscription identifier.',
          )

        if (this.subscription !== subscription) {
          if (this.transport.connected)
            void this.sendRequest('eth_unsubscribe', [subscriptionId]).catch(
              () => {},
            )
          return
        }
        this.subscriptionId = subscriptionId
      } catch (error) {
        this.reportSubscriptionError(error)
        throw error
      }
    })()

    this.subscriptionPromise = promise
    try {
      await promise
    } finally {
      if (this.subscriptionPromise === promise)
        this.subscriptionPromise = undefined
    }
  }

  private sendRequest(
    method: string,
    params: readonly unknown[],
    timeout = this.requestTimeout,
  ) {
    const id = ++this.nextId

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new RpcRequestTimeoutError(method, timeout))
      }, timeout)

      this.pending.set(id, { method, resolve, reject, timer })
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      })

      void this.transport.send(body).catch((error) => {
        const pending = this.pending.get(id)
        if (!pending) return
        clearTimeout(pending.timer)
        this.pending.delete(id)
        pending.reject(asError(error))
      })
    })
  }

  private async handleMessage(data: unknown) {
    let message: unknown
    try {
      message = JSON.parse(await messageToString(data))
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
      message.method === 'eth_subscription' &&
      isSubscriptionParams(message.params)
    ) {
      if (
        message.params.subscription !== this.subscriptionId ||
        !this.subscription
      )
        return

      const notification =
        message as JsonRpcSubscriptionNotification<unknown>
      try {
        this.subscription.onData(notification.params.result, notification)
      } catch (error) {
        this.reportSubscriptionError(error)
      }
      return
    }

    if (typeof message.id !== 'number' && typeof message.id !== 'string') return
    const pending = this.pending.get(message.id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pending.delete(message.id)

    if (isJsonRpcError(message.error)) {
      pending.reject(new JsonRpcResponseError(message.error))
      return
    }
    pending.resolve(message.result)
  }

  private rejectPending(error: Error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(error)
    }
    this.pending.clear()
  }

  private reportSubscriptionError(error: unknown) {
    const value = asError(error)
    this.subscription?.onError?.(value)
    this.onError?.(value)
  }
}

export function createWebSocketClient(options: WebSocketClientOptions) {
  return new WebSocketClient(options)
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

function isJsonRpcError(value: unknown): value is JsonRpcErrorObject {
  return (
    isRecord(value) &&
    typeof value.code === 'number' &&
    typeof value.message === 'string'
  )
}

function isSubscriptionParams(
  value: unknown,
): value is { subscription: string; result: unknown } {
  return isRecord(value) && typeof value.subscription === 'string'
}

async function messageToString(data: unknown): Promise<string> {
  if (typeof data === 'string') return data
  if (data instanceof ArrayBuffer)
    return new TextDecoder().decode(new Uint8Array(data))
  if (ArrayBuffer.isView(data))
    return new TextDecoder().decode(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    )
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data.text()
  throw new TypeError('Unsupported WebSocket message type.')
}

function asError(error: unknown) {
  return error instanceof Error
    ? error
    : new WebSocketConnectionError('Unknown WebSocket error.', {
        cause: error,
      })
}
