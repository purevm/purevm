import { WebSocketConnectionError } from './errors.js'
import type { ConnectionParametersManager } from './connection.params.js';

type SocketHandle = {
  socket: WebSocket
  cleanup: () => void
}

export type WebSocketConnectionOptions = {
  url: string
  protocols?: string | string[]
  connectionTimeout?: number
  disconnectionTimeout?: number
  onClose: (event: CloseEvent) => void
  onError: (error: Error) => void
  onMessage: (data: unknown) => void
  onOpen: () => void
}

export class WebSocketConnection {
  /** The parameters for the WebSocket connection */
  private readonly _parameters: ConnectionParametersManager;
  private readonly connectionTimeout: number
  private readonly disconnectionTimeout: number

  private handle: SocketHandle | null = null
  private connectPromise: Promise<void> | undefined
  private disconnectPromise: Promise<void> | undefined
  private rejectConnect: ((error: Error) => void) | undefined

  constructor(options: WebSocketConnectionOptions) {
    this.url = getWebSocketUrl(options.url)
    this.protocols = options.protocols
    this.connectionTimeout = options.connectionTimeout ?? 10_000
    this.disconnectionTimeout = options.disconnectionTimeout ?? 1_000
    this.onClose = options.onClose
    this.onError = options.onError
    this.onMessage = options.onMessage
    this.onOpen = options.onOpen
  }

  get connected() {
    return this.handle?.socket.readyState === WebSocket.OPEN
  }

  async connect() {
    if (this.connected) return
    if (this.connectPromise) return this.connectPromise
    if (this.disconnectPromise) await this.disconnectPromise

    const promise = this.createConnection()
    this.connectPromise = promise
    try {
      await promise
    } finally {
      if (this.connectPromise === promise) this.connectPromise = undefined
    }
  }

  async disconnect(options: { code?: number; reason?: string } = {}) {
    if (this.disconnectPromise) return this.disconnectPromise

    const handle = this.handle
    if (!handle) return

    this.handle = null
    handle.cleanup()
    this.rejectConnect?.(
      new WebSocketConnectionError(
        'The WebSocket was disconnected before connecting.',
      ),
    )
    this.rejectConnect = undefined

    if (handle.socket.readyState === WebSocket.CLOSED) return

    const promise = new Promise<void>((resolve, reject) => {
      const onClose = () => {
        clearTimeout(timer)
        handle.socket.removeEventListener('close', onClose)
        resolve()
      }
      const timer = setTimeout(() => {
        handle.socket.removeEventListener('close', onClose)
        reject(
          new WebSocketConnectionError(
            `WebSocket disconnection timed out after ${this.disconnectionTimeout}ms.`,
          ),
        )
      }, this.disconnectionTimeout)

      handle.socket.addEventListener('close', onClose)
      try {
        handle.socket.close(options.code, options.reason)
      } catch (error) {
        clearTimeout(timer)
        handle.socket.removeEventListener('close', onClose)
        reject(
          new WebSocketConnectionError('WebSocket close failed.', {
            cause: error,
          }),
        )
      }
    })

    this.disconnectPromise = promise
    try {
      await promise
    } finally {
      if (this.disconnectPromise === promise)
        this.disconnectPromise = undefined
    }
  }

  send(data: string) {
    if (!this.handle || !this.connected)
      throw new WebSocketConnectionError('The WebSocket is not open.')
    this.handle.socket.send(data)
  }

  private createConnection() {
    let timer: ReturnType<typeof setTimeout> | undefined

    const promise = new Promise<void>((resolve, reject) => {
      let opened = false
      this.rejectConnect = reject

      let handle: SocketHandle
      try {
        const socket = new WebSocket(this.url, this.protocols)
        const onOpen = () => {
          if (this.handle !== handle) return
          opened = true
          this.rejectConnect = undefined
          if (timer) clearTimeout(timer)
          resolve()
          this.onOpen()
        }
        const onMessage = (event: MessageEvent) => {
          if (this.handle !== handle) return
          this.onMessage(event.data)
        }
        const onClose = (event: CloseEvent) => {
          if (this.handle !== handle) return
          if (timer) clearTimeout(timer)
          handle.cleanup()
          this.handle = null
          if (!opened)
            reject(
              new WebSocketConnectionError(
                'The WebSocket closed before connecting.',
              ),
            )
          this.rejectConnect = undefined
          this.onClose(event)
        }
        const onError = (event: Event) => {
          if (this.handle !== handle) return
          const error = getWebSocketError(event)

          if (!opened) {
            if (timer) clearTimeout(timer)
            const connectionError = new WebSocketConnectionError(
              'The WebSocket emitted an error while connecting.',
              { cause: error },
            )
            this.rejectConnect = undefined
            const disconnectPromise = this.disconnect()
            void disconnectPromise.then(
              () => reject(connectionError),
              (disconnectError) =>
                reject(
                  new WebSocketConnectionError(connectionError.message, {
                    cause: disconnectError,
                  }),
                ),
            )
          }
          this.onError(error)
        }

        socket.addEventListener('open', onOpen)
        socket.addEventListener('message', onMessage)
        socket.addEventListener('close', onClose)
        socket.addEventListener('error', onError)
        handle = {
          socket,
          cleanup() {
            socket.removeEventListener('open', onOpen)
            socket.removeEventListener('message', onMessage)
            socket.removeEventListener('close', onClose)
            socket.removeEventListener('error', onError)
          },
        }
      } catch (error) {
        this.rejectConnect = undefined
        reject(
          new WebSocketConnectionError('WebSocket creation failed.', {
            cause: error,
          }),
        )
        return
      }

      this.handle = handle
      timer = setTimeout(() => {
        if (this.handle !== handle) return
        this.rejectConnect = undefined
        const error = new WebSocketConnectionError(
          `WebSocket connection timed out after ${this.connectionTimeout}ms.`,
        )
        void this.disconnect().then(
          () => reject(error),
          (disconnectError) =>
            reject(
              new WebSocketConnectionError(error.message, {
                cause: disconnectError,
              }),
            ),
        )
      }, this.connectionTimeout)
    })

    return promise.finally(() => {
      if (timer) clearTimeout(timer)
    })
  }
}

function getWebSocketUrl(url: string) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:')
    throw new TypeError('WebSocket URL must use ws: or wss:.')
  return parsed.toString()
}

function getWebSocketError(event: Event) {
  const value = (event as Event & { error?: unknown }).error
  if (value instanceof Error) return value
  if (typeof value === 'string') return new Error(value)
  return new Error('WebSocket error.')
}
