import type { Address, Hex } from '../../types/shared.types.js'

export type JsonRpcId = number | string | null

export type JsonRpcErrorObject = {
  code: number
  message: string
  data?: unknown
}

export type JsonRpcResponse =
  | {
      id: JsonRpcId
      jsonrpc: '2.0'
      result: unknown
    }
  | {
      id: JsonRpcId
      jsonrpc: '2.0'
      error: JsonRpcErrorObject
    }

export type RpcMethod = {
  method: string
  params?: readonly unknown[] | undefined
  result: unknown
}

export type RpcRequest<method extends RpcMethod> = {
  method: method['method']
  timeout?: number
} & (undefined extends method['params']
  ? { params?: method['params'] }
  : { params: method['params'] })

export type SubscriptionNotification<result = unknown> = {
  jsonrpc: '2.0'
  method: 'eth_subscription'
  params: {
    subscription: string
    result: result
  }
}

export type SubscriptionLogsFilter = {
  address?: Address | Address[]
  topics?: (Hex | Hex[] | null)[]
}

export type SubscriptionParameters =
  | [subscription: 'syncing']
  | [subscription: 'newHeads']
  | [subscription: 'logs', filter?: SubscriptionLogsFilter]
  | [
      subscription: 'newPendingTransactions',
      fullTransactions?: boolean,
    ]

export type SubscriptionOptions<result = unknown> = {
  method: 'eth_subscribe'
  params: SubscriptionParameters
  onData: (
    result: result,
    notification: SubscriptionNotification<result>,
  ) => void
  onError?: (error: Error) => void
  timeout?: number
}

export type ReconnectOptions = {
  minDelay?: number
  maxDelay?: number
  factor?: number
  jitter?: number
}

export type WebSocketClientOptions = {
  url: string
  protocols?: string | string[]
  connectionTimeout?: number
  disconnectionTimeout?: number
  requestTimeout?: number
  reconnect?: false | ReconnectOptions
  onClose?: (error: Error) => void
  onError?: (error: Error) => void
}

export type CreateWebSocketClientOptions<result = unknown> =
  WebSocketClientOptions & {
    subscription: SubscriptionOptions<result>
  }
