import type { JsonRpcErrorObject } from './client.types.js'

export class WebSocketConnectionError extends Error {
  override readonly name = 'WebSocketConnectionError'
}

export class WebSocketStoppedError extends Error {
  override readonly name = 'WebSocketStoppedError'

  constructor() {
    super('The WebSocket client is stopped.')
  }
}

export class RpcTimeoutError extends Error {
  override readonly name = 'RpcTimeoutError'

  constructor(
    readonly method: string,
    readonly timeout: number,
  ) {
    super(`${method} timed out after ${timeout}ms.`)
  }
}

export class RpcProtocolError extends Error {
  override readonly name = 'RpcProtocolError'

  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

export class RpcProviderError extends Error {
  override readonly name = 'RpcProviderError'

  constructor(readonly rpcError: JsonRpcErrorObject) {
    super(`RPC error ${rpcError.code}: ${rpcError.message}`, {
      cause: rpcError,
    })
  }
}
