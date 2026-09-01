import type {
  NewHeadsSubscriptionResult,
  RequestOptions,
  RpcSubscription,
  SubscriptionHandlers,
  WebSocketTransportOptions,
} from "@purevm/rpc";
import { afterEach, describe, expect, test, vi } from "vitest";

import { NewBlocks } from "../new-blocks.js";
import type {
  NewBlocksClientFactory,
  NewBlocksEvent,
  NewBlocksHttpClient,
  NewBlocksOptions,
  NewBlocksWebSocketClient,
  RpcBlockHeader,
  RpcLatestBlock,
} from "../types.js";

const hash = (character: string) => `0x${character.repeat(64)}` as const;
const block = (number: number, character: string, parentCharacter: string): RpcLatestBlock => ({
  hash: hash(character),
  number: `0x${number.toString(16)}`,
  parentHash: hash(parentCharacter),
  timestamp: "0x64",
});

class FakeHttpClient implements NewBlocksHttpClient {
  latest: RpcLatestBlock | null = block(10, "a", "0");
  readonly ethGetBlockByTag = vi.fn<NewBlocksHttpClient["ethGetBlockByTag"]>(
    async () => this.latest,
  );
}

class FakeWebSocketClient implements NewBlocksWebSocketClient {
  handlers?: SubscriptionHandlers<NewHeadsSubscriptionResult>;
  heartbeatError?: unknown;
  subscribeError?: unknown;
  readonly close = vi.fn<() => void>();
  readonly unsubscribe = vi.fn<RpcSubscription["unsubscribe"]>(async () => true);

  async ethBlockNumber(_options?: RequestOptions): Promise<`0x${string}`> {
    if (this.heartbeatError) throw this.heartbeatError;
    return "0xa";
  }

  async ethSubscribeNewHeads(
    handlers: SubscriptionHandlers<NewHeadsSubscriptionResult>,
  ): Promise<RpcSubscription> {
    if (this.subscribeError) throw this.subscribeError;
    this.handlers = handlers;
    return { id: "heads", unsubscribe: this.unsubscribe };
  }

  async netVersion(_options?: RequestOptions): Promise<string> {
    if (this.heartbeatError) throw this.heartbeatError;
    return "1";
  }

  emit(value: RpcBlockHeader): void {
    this.handlers?.onData(value as NewHeadsSubscriptionResult);
  }

  fail(error: Error): void {
    this.handlers?.onError?.(error);
  }
}

class FakeClientFactory implements NewBlocksClientFactory {
  readonly http = new FakeHttpClient();
  readonly sockets: FakeWebSocketClient[] = [];
  private socketIndex = 0;

  createHttp(): NewBlocksHttpClient {
    return this.http;
  }

  createWebSocket(_options: WebSocketTransportOptions): NewBlocksWebSocketClient {
    const socket = this.sockets[this.socketIndex++];
    if (!socket) throw new Error("No fake WebSocket configured");
    return socket;
  }
}

type Callbacks = {
  errors: Error[];
  events: NewBlocksEvent[];
  logs: string[];
};

function createCallbacks(): Callbacks {
  return { errors: [], events: [], logs: [] };
}

function createOptions(callbacks: Callbacks): NewBlocksOptions {
  return {
    heartbeat: { intervalMs: 1_000, method: "net_version", timeoutMs: 100 },
    http: { url: "https://rpc.example.com" },
    onError: (error) => callbacks.errors.push(error),
    onEvent: (event) => callbacks.events.push(event),
    onLog: (message) => callbacks.logs.push(message),
    polling: { intervalMs: 100, staleAfterMs: 500 },
    reconnect: {
      delay: (attempt) => attempt * 100,
      maxDelayMs: 300,
      minDelayMs: 50,
    },
    websocket: { url: "wss://rpc.example.com" },
  };
}

afterEach(() => vi.useRealTimers());

describe("NewBlocks", () => {
  test("emits exact block, replacement, parent reorg, and gap events", async () => {
    const callbacks = createCallbacks();
    const clients = new FakeClientFactory();
    const socket = new FakeWebSocketClient();
    clients.sockets.push(socket);
    const stream = new NewBlocks(createOptions(callbacks), clients);

    await stream.start();
    socket.emit(block(10, "a", "0"));
    socket.emit(block(11, "b", "a"));
    socket.emit(block(11, "c", "a"));
    socket.emit(block(12, "d", "f"));
    socket.emit(block(15, "e", "d"));
    socket.emit(block(14, "9", "8"));

    expect(callbacks.events.map((event) => event.type)).toEqual([
      "block",
      "block",
      "reorg",
      "reorg",
      "gap",
    ]);
    expect(callbacks.events[2]).toMatchObject({ kind: "replacement" });
    expect(callbacks.events[3]).toMatchObject({ kind: "parent-mismatch" });
    expect(callbacks.events[4]).toMatchObject({
      missing: { count: 2n, from: 13n, to: 14n },
    });
    expect(callbacks.logs).toContain("[NewBlocks] ignored old websocket block 14");
    await stream.stop();
  });

  test("polls through connection failure and reconnects with the configured delay", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const clients = new FakeClientFactory();
    const first = new FakeWebSocketClient();
    first.subscribeError = new Error("connection failed");
    const second = new FakeWebSocketClient();
    clients.sockets.push(first, second);
    const stream = new NewBlocks(createOptions(callbacks), clients);

    await stream.start();
    expect(callbacks.errors.map((error) => error.message)).toContain("connection failed");
    expect(first.close).toHaveBeenCalledOnce();
    expect(callbacks.logs).toContain("[NewBlocks] http polling started");
    expect(callbacks.logs).toContain("[NewBlocks] websocket reconnect scheduled in 100ms");

    clients.http.latest = block(11, "b", "a");
    await vi.advanceTimersByTimeAsync(100);
    expect(second.handlers).toBeDefined();
    expect(callbacks.events.at(-1)).toMatchObject({ block: { number: 11n }, source: "http" });

    second.emit(block(11, "b", "a"));
    expect(callbacks.logs).toContain("[NewBlocks] http polling stopped");
    await stream.stop();
  });

  test("does not treat an older WebSocket block as proof of subscription freshness", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const clients = new FakeClientFactory();
    clients.http.latest = block(20, "a", "0");
    const staleSocket = new FakeWebSocketClient();
    const recoveredSocket = new FakeWebSocketClient();
    clients.sockets.push(staleSocket, recoveredSocket);
    const stream = new NewBlocks(createOptions(callbacks), clients);

    await stream.start();
    await vi.advanceTimersByTimeAsync(400);
    staleSocket.emit(block(19, "b", "0"));
    await vi.advanceTimersByTimeAsync(100);

    expect(callbacks.errors.map((error) => error.message)).toContain(
      "No WebSocket block received for 500ms",
    );
    expect(callbacks.logs).toContain("[NewBlocks] ignored old websocket block 19");
    await stream.stop();
  });

  test("uses heartbeat failure and stale subscriptions for recovery", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const clients = new FakeClientFactory();
    const heartbeatSocket = new FakeWebSocketClient();
    heartbeatSocket.heartbeatError = new Error("heartbeat failed");
    const staleSocket = new FakeWebSocketClient();
    const recoveredSocket = new FakeWebSocketClient();
    clients.sockets.push(heartbeatSocket, staleSocket, recoveredSocket);
    const options = createOptions(callbacks);
    options.heartbeat.intervalMs = 50;
    const stream = new NewBlocks(options, clients);

    await stream.start();
    await vi.advanceTimersByTimeAsync(50);
    expect(callbacks.errors.map((error) => error.message)).toContain("heartbeat failed");

    await vi.advanceTimersByTimeAsync(100);
    expect(staleSocket.handlers).toBeDefined();
    await vi.advanceTimersByTimeAsync(500);
    expect(callbacks.errors.map((error) => error.message)).toContain(
      "No WebSocket block received for 500ms",
    );
    await vi.advanceTimersByTimeAsync(200);
    expect(recoveredSocket.handlers).toBeDefined();
    await stream.stop();
  });

  test("start and stop are async, idempotent, and clean up the subscription", async () => {
    const callbacks = createCallbacks();
    const clients = new FakeClientFactory();
    const socket = new FakeWebSocketClient();
    clients.sockets.push(socket);
    const stream = new NewBlocks(createOptions(callbacks), clients);

    await Promise.all([stream.start(), stream.start()]);
    await stream.start();
    await Promise.all([stream.stop(), stream.stop()]);

    expect(socket.unsubscribe).toHaveBeenCalledOnce();
    expect(socket.close).toHaveBeenCalledOnce();
    expect(callbacks.logs.filter((message) => message === "[NewBlocks] starting")).toHaveLength(1);
  });

  test("contains consumer callback failures and validates timing configuration", async () => {
    const callbacks = createCallbacks();
    const clients = new FakeClientFactory();
    clients.sockets.push(new FakeWebSocketClient());
    const options = createOptions(callbacks);
    options.onEvent = () => {
      throw new Error("consumer failed");
    };
    const stream = new NewBlocks(options, clients);

    await stream.start();
    expect(callbacks.errors.map((error) => error.message)).toContain("consumer failed");
    await stream.stop();

    options.polling.intervalMs = 0;
    expect(() => new NewBlocks(options, clients)).toThrow(
      "Polling interval must be a positive safe integer",
    );
  });
});
