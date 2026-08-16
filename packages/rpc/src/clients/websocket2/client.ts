import type {
  CreateWebSocketClientOptions,
  JsonRpcErrorObject,
  ReconnectOptions,
  RpcMethod,
  RpcRequest,
  SubscriptionNotification,
  SubscriptionOptions,
  WebSocketClientOptions,
} from './client.types.js'
import { WebSocketConnection } from './connection.js'
import {
  RpcProtocolError,
  RpcProviderError,
  RpcTimeoutError,
  WebSocketConnectionError,
  WebSocketStoppedError,
} from './errors.js'

type PendingRequest = {
  method: string
  resolve: (result: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

type ActiveSubscription = SubscriptionOptions<any>

export class WebSocketClient {
  private readonly connection: WebSocketConnection
  private readonly requestTimeout: number
  private readonly reconnect: false | Required<ReconnectOptions>
  private readonly onClose: ((error: Error) => void) | undefined
  private readonly onError: ((error: Error) => void) | undefined

  private readonly pending = new Map<number, PendingRequest>()
  private nextRequestId = 0

  private subscription: ActiveSubscription | undefined
  private subscriptionId: string | undefined
  private activationPromise: Promise<void> | undefined
  private replacementQueue: Promise<void> = Promise.resolve()

  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private reconnectAttempt = 0
  private running = false
  private stopped = false
  private cycleActive = false
  private failurePromise: Promise<void> | undefined

  constructor(options: WebSocketClientOptions) {
    this.requestTimeout = options.requestTimeout ?? 10_000
    this.reconnect =
      options.reconnect === false
        ? false
        : {
            minDelay: options.reconnect?.minDelay ?? 500,
            maxDelay: options.reconnect?.maxDelay ?? 10_000,
            factor: options.reconnect?.factor ?? 2,
            jitter: options.reconnect?.jitter ?? 0.2,
          }
    this.onClose = options.onClose
    this.onError = options.onError

    this.connection = new WebSocketConnection({
      url: options.url,
      protocols: options.protocols,
      connectionTimeout: options.connectionTimeout,
      disconnectionTimeout: options.disconnectionTimeout,
      onOpen: () => {
        this.reconnectAttempt = 0
        if (this.subscription)
          void this.activateSubscription().catch((error) => {
            void this.failConnection(asError(error))
          })
      },
      onMessage: (data) => {
        void this.handleMessage(data)
      },
      onClose: (event) => {
        this.handleDisconnected(
          new WebSocketConnectionError(
            `The WebSocket closed with code ${event.code}${
              event.reason ? `: ${event.reason}` : '.'
            }`,
          ),
        )
      },
      onError: (error) => {
        this.notifyError(error)
        void this.failConnection(error)
      },
    })
  }

  get connected() {
    return this.connection.connected
  }

  get subscriptionIdentifier() {
    return this.subscriptionId
  }

  request<method extends RpcMethod>(
    request: RpcRequest<method>,
  ): Promise<method['result']> {
    return this.sendRequest<method['result']>(
      request.method,
      request.params ?? [],
      request.timeout,
    )
  }

  subscribe<result = unknown>(options: SubscriptionOptions<result>) {
    const operation = this.replacementQueue.then(() =>
      this.replaceSubscription(options),
    )
    this.replacementQueue = operation.then(
      () => {},
      () => {},
    )
    return operation
  }

  async unsubscribe() {
    const subscription = this.subscription
    const subscriptionId = this.subscriptionId
    this.subscription = undefined
    this.subscriptionId = undefined

    if (!subscription) return false
    if (this.activationPromise)
      await this.activationPromise.catch(() => {})
    if (!subscriptionId || !this.connected) return false

    return this.sendRequest<boolean>(
      'eth_unsubscribe',
      [subscriptionId],
      this.requestTimeout,
    )
  }

  async recreate() {
    const subscription = this.subscription
    if (subscription) {
      await this.subscribe(subscription)
      return
    }

    await this.replaceSocket()
  }

  async stop() {
    if (this.stopped) return
    this.stopped = true
    this.running = false
    this.clearReconnectTimer()
    this.subscription = undefined
    this.subscriptionId = undefined
    this.cycleActive = false
    this.rejectPending(new WebSocketStoppedError())
    await this.connection.disconnect({
      code: 1_000,
      reason: 'client stopped',
    })
  }

  private async replaceSubscription<result>(
    options: SubscriptionOptions<result>,
  ) {
    if (this.stopped) throw new WebSocketStoppedError()

    const previousActivation = this.activationPromise
    this.subscription = undefined
    this.subscriptionId = undefined
    this.rejectPending(
      new WebSocketConnectionError(
        'The WebSocket was replaced for a new subscription.',
      ),
    )
    if (previousActivation)
      await previousActivation.catch(() => {})

    await this.replaceSocket()
    this.subscription = options

    try {
      await this.ensureConnected()
      await this.activateSubscription()
    } catch (error) {
      const value = asError(error)
      this.reportSubscriptionError(value, options)
      void this.failConnection(value)
      throw value
    }

    return () => this.unsubscribe()
  }

  private async replaceSocket() {
    if (this.stopped) throw new WebSocketStoppedError()

    this.running = true
    this.clearReconnectTimer()
    this.cycleActive = false
    try {
      await this.connection.disconnect({
        code: 1_000,
        reason: 'socket replaced',
      })
    } catch (error) {
      // A dead socket may never acknowledge close. It is already detached,
      // so replacement must continue with a fresh native WebSocket.
      this.notifyError(asError(error))
    }
  }

  private async ensureConnected() {
    if (this.stopped) throw new WebSocketStoppedError()
    if (this.connected) return

    this.running = true
    this.clearReconnectTimer()
    this.cycleActive = true
    try {
      await this.connection.connect()
    } catch (error) {
      const value = asError(error)
      this.handleDisconnected(value)
      throw value
    }
  }

  private sendRequest<result>(
    method: string,
    params: readonly unknown[],
    timeout = this.requestTimeout,
  ) {
    return new Promise<result>((resolve, reject) => {
      void this.ensureConnected()
        .then(() => {
          const id = this.takeRequestId()
          const timer = setTimeout(() => {
            this.pending.delete(id)
            reject(new RpcTimeoutError(method, timeout))
          }, timeout)

          this.pending.set(id, {
            method,
            resolve: resolve as (result: unknown) => void,
            reject,
            timer,
          })

          try {
            this.connection.send(
              JSON.stringify({
                id,
                jsonrpc: '2.0',
                method,
                params,
              }),
            )
          } catch (error) {
            clearTimeout(timer)
            this.pending.delete(id)
            const value = asError(error)
            reject(value)
            void this.failConnection(value)
          }
        })
        .catch(reject)
    })
  }

  private async activateSubscription() {
    const subscription = this.subscription
    if (!subscription || this.subscriptionId) return
    if (this.activationPromise) return this.activationPromise

    const promise = (async () => {
      try {
        const subscriptionId = await this.sendRequest<unknown>(
          subscription.method,
          subscription.params,
          subscription.timeout,
        )
        if (typeof subscriptionId !== 'string')
          throw new RpcProtocolError(
            'eth_subscribe returned an invalid subscription identifier.',
          )

        if (this.subscription !== subscription) return
        this.subscriptionId = subscriptionId
      } catch (error) {
        if (this.subscription === subscription)
          this.reportSubscriptionError(asError(error), subscription)
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

  private async failConnection(error: Error) {
    if (this.failurePromise) return this.failurePromise

    const promise = (async () => {
      try {
        await this.connection.disconnect()
      } catch (disconnectError) {
        this.notifyError(asError(disconnectError))
      }
      this.handleDisconnected(error)
    })()

    this.failurePromise = promise
    try {
      await promise
    } finally {
      if (this.failurePromise === promise)
        this.failurePromise = undefined
    }
  }

  private handleDisconnected(error: Error) {
    if (!this.cycleActive) return
    this.cycleActive = false
    this.subscriptionId = undefined
    this.rejectPending(error)
    this.notifyClose(error)
    this.scheduleReconnect()
  }

  private scheduleReconnect() {
    if (
      this.stopped ||
      !this.running ||
      this.reconnect === false ||
      this.reconnectTimer
    )
      return

    const exponentialDelay = Math.min(
      this.reconnect.maxDelay,
      this.reconnect.minDelay *
        this.reconnect.factor ** this.reconnectAttempt++,
    )
    const jitter =
      exponentialDelay *
      this.reconnect.jitter *
      (Math.random() * 2 - 1)
    const delay = Math.max(0, exponentialDelay + jitter)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      void this.ensureConnected().catch(() => {})
    }, delay)
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) return
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
  }

  private async handleMessage(data: unknown) {
    let message: unknown
    try {
      message = JSON.parse(await messageToString(data))
    } catch (error) {
      this.notifyError(
        new RpcProtocolError('Received invalid JSON-RPC data.', {
          cause: error,
        }),
      )
      return
    }

    if (!isRecord(message)) {
      this.notifyError(new RpcProtocolError('JSON-RPC message is not an object.'))
      return
    }

    if (
      message.method === 'eth_subscription' &&
      isSubscriptionNotification(message)
    ) {
      if (
        message.params.subscription !== this.subscriptionId ||
        !this.subscription
      )
        return

      const notification = message as SubscriptionNotification<unknown>
      try {
        this.subscription.onData(
          notification.params.result,
          notification,
        )
      } catch (error) {
        this.reportSubscriptionError(
          asError(error),
          this.subscription,
        )
      }
      return
    }

    if (typeof message.id !== 'number') return
    const pending = this.pending.get(message.id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pending.delete(message.id)

    if (message.jsonrpc !== '2.0') {
      pending.reject(new RpcProtocolError('Invalid JSON-RPC version.'))
      return
    }

    const hasResult = Object.hasOwn(message, 'result')
    const hasError = Object.hasOwn(message, 'error')
    if (hasResult === hasError) {
      pending.reject(
        new RpcProtocolError(
          'JSON-RPC response must contain exactly one result or error.',
        ),
      )
      return
    }

    if (hasError) {
      if (!isRpcError(message.error)) {
        pending.reject(new RpcProtocolError('Invalid JSON-RPC error object.'))
        return
      }
      pending.reject(new RpcProviderError(message.error))
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

  private reportSubscriptionError(
    error: Error,
    subscription: ActiveSubscription,
  ) {
    try {
      subscription.onError?.(error)
    } catch {}
    this.notifyError(error)
  }

  private notifyClose(error: Error) {
    try {
      this.onClose?.(error)
    } catch {}
  }

  private notifyError(error: Error) {
    try {
      this.onError?.(error)
    } catch {}
  }

  private takeRequestId() {
    this.nextRequestId =
      this.nextRequestId >= Number.MAX_SAFE_INTEGER
        ? 1
        : this.nextRequestId + 1
    return this.nextRequestId
  }
}

export async function createWebSocketClient<result = unknown>(
  options: CreateWebSocketClientOptions<result>,
) {
  const { subscription, ...clientOptions } = options
  const client = new WebSocketClient(clientOptions)
  try {
    await client.subscribe(subscription)
    return client
  } catch (error) {
    await client.stop().catch(() => {})
    throw error
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

function isRpcError(value: unknown): value is JsonRpcErrorObject {
  return (
    isRecord(value) &&
    typeof value.code === 'number' &&
    typeof value.message === 'string'
  )
}

function isSubscriptionNotification(
  value: Record<string, any>,
): value is SubscriptionNotification {
  return (
    value.jsonrpc === '2.0' &&
    isRecord(value.params) &&
    typeof value.params.subscription === 'string' &&
    Object.hasOwn(value.params, 'result')
  )
}

async function messageToString(data: unknown) {
  if (typeof data === 'string') return data
  if (data instanceof ArrayBuffer)
    return new TextDecoder().decode(new Uint8Array(data))
  if (ArrayBuffer.isView(data))
    return new TextDecoder().decode(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    )
  if (typeof Blob !== 'undefined' && data instanceof Blob)
    return data.text()
  throw new TypeError('Unsupported WebSocket message type.')
}

function asError(error: unknown) {
  return error instanceof Error
    ? error
    : new WebSocketConnectionError('Unknown WebSocket error.', {
        cause: error,
      })
}
