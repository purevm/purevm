import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  createWebSocketClient,
  WebSocketClient,
  WebSocketConnectionError,
} from '../src/clients/websocket2/index.js'

const originalWebSocket = Object.getOwnPropertyDescriptor(
  globalThis,
  'WebSocket',
)

afterEach(() => {
  if (originalWebSocket)
    Object.defineProperty(globalThis, 'WebSocket', originalWebSocket)
  else delete (globalThis as { WebSocket?: typeof WebSocket }).WebSocket
})

class FakeWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readyState = FakeWebSocket.CONNECTING
  readonly sent: Record<string, any>[] = []
  closeCount = 0
  private readonly listeners = new Map<string, Set<(event: any) => void>>()

  constructor(
    private readonly onSend:
      | ((request: Record<string, any>, socket: FakeWebSocket) => void)
      | undefined,
    private readonly silentClose: boolean,
  ) {}

  addEventListener(type: string, listener: (event: any) => void) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    this.listeners.get(type)?.delete(listener)
  }

  send(data: string) {
    if (this.readyState !== FakeWebSocket.OPEN)
      throw new Error('Socket is not open.')
    const request = JSON.parse(data)
    this.sent.push(request)
    this.onSend?.(request, this)
  }

  close() {
    this.closeCount++
    if (this.readyState === FakeWebSocket.CLOSED) return
    this.readyState = FakeWebSocket.CLOSING
    if (this.silentClose) return
    queueMicrotask(() => {
      this.readyState = FakeWebSocket.CLOSED
      this.emit('close', { code: 1_000, reason: '' })
    })
  }

  open() {
    this.readyState = FakeWebSocket.OPEN
    this.emit('open', {})
  }

  disconnect() {
    this.readyState = FakeWebSocket.CLOSED
    this.emit('close', { code: 1_006, reason: '' })
  }

  receive(message: unknown) {
    this.emit('message', { data: JSON.stringify(message) })
  }

  private emit(type: string, event: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
}

function installWebSocket(
  onSend?: (request: Record<string, any>, socket: FakeWebSocket) => void,
  options: { silentCloseSockets?: number } = {},
) {
  const sockets: FakeWebSocket[] = []
  class TestWebSocket extends FakeWebSocket {
    constructor() {
      const index = sockets.length
      super(onSend, index < (options.silentCloseSockets ?? 0))
      sockets.push(this)
      queueMicrotask(() => this.open())
    }
  }
  Object.defineProperty(globalThis, 'WebSocket', {
    configurable: true,
    value: TestWebSocket,
    writable: true,
  })
  return sockets
}

function respond(
  socket: FakeWebSocket,
  request: Record<string, any>,
  result: unknown,
) {
  queueMicrotask(() => {
    socket.receive({
      id: request.id,
      jsonrpc: '2.0',
      result,
    })
  })
}

function waitFor(predicate: () => boolean, timeout = 100) {
  const started = Date.now()
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      if (predicate()) return resolve()
      if (Date.now() - started >= timeout)
        return reject(new Error('Condition was not met.'))
      setTimeout(check, 1)
    }
    check()
  })
}

test('creates with a subscription and performs raw RPC requests', async () => {
  const sockets = installWebSocket((request, socket) => {
    respond(
      socket,
      request,
      request.method === 'eth_subscribe' ? 'sub-1' : '0x10',
    )
  })
  const client = await createWebSocketClient({
    url: 'ws://test',
    subscription: {
      method: 'eth_subscribe',
      params: ['newHeads'],
      onData() {},
    },
  })

  const result = await client.request<{
    method: 'eth_blockNumber'
    params?: undefined
    result: string
  }>({ method: 'eth_blockNumber' })

  assert.equal(result, '0x10')
  assert.equal(sockets.length, 1)
  await client.stop()
})

test('same subscription replacement always creates a new socket', async () => {
  let subscriptionCount = 0
  const received: unknown[] = []
  const sockets = installWebSocket((request, socket) => {
    if (request.method !== 'eth_subscribe') return
    subscriptionCount++
    respond(socket, request, `sub-${subscriptionCount}`)
  })
  const client = await createWebSocketClient({
    url: 'ws://test',
    subscription: {
      method: 'eth_subscribe',
      params: ['newHeads'],
      onData: (head) => received.push(head),
    },
  })
  const oldSocket = sockets[0]!

  await client.subscribe({
    method: 'eth_subscribe',
    params: ['newHeads'],
    onData: (head) => received.push(head),
  })

  assert.equal(sockets.length, 2)
  assert.equal(oldSocket.closeCount, 1)
  assert.equal(client.subscriptionIdentifier, 'sub-2')

  oldSocket.receive({
    jsonrpc: '2.0',
    method: 'eth_subscription',
    params: { subscription: 'sub-2', result: { number: '0x1' } },
  })
  sockets[1]!.receive({
    jsonrpc: '2.0',
    method: 'eth_subscription',
    params: { subscription: 'sub-2', result: { number: '0x2' } },
  })
  await waitFor(() => received.length === 1)
  assert.deepEqual(received, [{ number: '0x2' }])
  await client.stop()
})

test('replacement continues when an idle socket never closes', async () => {
  let subscriptionCount = 0
  const errors: Error[] = []
  const sockets = installWebSocket(
    (request, socket) => {
      if (request.method !== 'eth_subscribe') return
      subscriptionCount++
      respond(socket, request, `sub-${subscriptionCount}`)
    },
    { silentCloseSockets: 1 },
  )
  const client = await createWebSocketClient({
    url: 'ws://test',
    disconnectionTimeout: 5,
    onError: (error) => errors.push(error),
    subscription: {
      method: 'eth_subscribe',
      params: ['newHeads'],
      onData() {},
    },
  })

  await client.subscribe({
    method: 'eth_subscribe',
    params: ['logs'],
    onData() {},
  })

  assert.equal(sockets.length, 2)
  assert.equal(client.subscriptionIdentifier, 'sub-2')
  assert.match(errors[0]?.message ?? '', /disconnection timed out/)
  await client.stop()
})

test('replacement rejects requests belonging to the old socket', async () => {
  let subscriptionCount = 0
  const sockets = installWebSocket((request, socket) => {
    if (request.method !== 'eth_subscribe') return
    subscriptionCount++
    respond(socket, request, `sub-${subscriptionCount}`)
  })
  const client = await createWebSocketClient({
    url: 'ws://test',
    subscription: {
      method: 'eth_subscribe',
      params: ['newHeads'],
      onData() {},
    },
  })

  const pending = client.request<{
    method: 'eth_blockNumber'
    params?: undefined
    result: string
  }>({ method: 'eth_blockNumber' })
  await waitFor(() => sockets[0]!.sent.length === 2)

  await client.subscribe({
    method: 'eth_subscribe',
    params: ['logs'],
    onData() {},
  })

  await assert.rejects(pending, WebSocketConnectionError)
  assert.equal(client.subscriptionIdentifier, 'sub-2')
  await client.stop()
})

test('unexpected closure reconnects and restores the subscription', async () => {
  let subscriptionCount = 0
  const sockets = installWebSocket((request, socket) => {
    if (request.method !== 'eth_subscribe') return
    subscriptionCount++
    respond(socket, request, `sub-${subscriptionCount}`)
  })
  const client = new WebSocketClient({
    url: 'ws://test',
    reconnect: { minDelay: 0, maxDelay: 0, jitter: 0 },
  })

  await client.subscribe({
    method: 'eth_subscribe',
    params: ['newHeads'],
    onData() {},
  })
  sockets[0]!.disconnect()
  await waitFor(() => client.subscriptionIdentifier === 'sub-2')

  assert.equal(sockets.length, 2)
  await client.stop()
})
