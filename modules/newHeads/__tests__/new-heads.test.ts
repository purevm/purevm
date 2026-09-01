import type {
  NewHeadsSubscriptionResult,
  RpcSubscription,
  SubscriptionHandlers,
  WebSocketEvent,
  WebSocketLike,
  WebSocketListener,
  WebSocketTransportOptions,
} from "@purevm/rpc";
import { afterEach, describe, expect, test, vi } from "vitest";

import { NewHeads } from "../new-heads.js";
import type {
  HeadEvent,
  NewHeadsClientFactory,
  NewHeadsHttpClient,
  NewHeadsOptions,
  NewHeadsWebSocketClient,
  ReorgEvent,
  RpcLatestBlock,
} from "../types.js";

const hash = (character: string) => `0x${character.repeat(64)}` as const;
const block = (number: string, character: string): RpcLatestBlock => ({
  hash: hash(character),
  number: number as `0x${string}`,
});

class FakeHttpClient implements NewHeadsHttpClient {
  readonly ethGetBlockByTag = vi.fn<NewHeadsHttpClient["ethGetBlockByTag"]>(async () => {
    const response = this.responses.shift();
    if (response instanceof Error) throw response;
    return response ?? null;
  });

  constructor(readonly responses: (Error | RpcLatestBlock | null)[] = []) {}
}

class FakeWebSocketClient implements NewHeadsWebSocketClient {
  closed = false;
  handlers?: SubscriptionHandlers<NewHeadsSubscriptionResult>;
  subscribeError?: unknown;
  readonly ethBlockNumber = vi.fn<NewHeadsWebSocketClient["ethBlockNumber"]>(async () => "0x1");
  readonly netVersion = vi.fn<NewHeadsWebSocketClient["netVersion"]>(async () => "1");
  readonly unsubscribe = vi.fn<RpcSubscription["unsubscribe"]>(async () => true);
  readonly ethSubscribeNewHeads = vi.fn<NewHeadsWebSocketClient["ethSubscribeNewHeads"]>(
    async (handlers) => {
      if (this.subscribeError) throw this.subscribeError;
      this.handlers = handlers;
      return { id: "heads", unsubscribe: this.unsubscribe };
    },
  );

  close(): void {
    this.closed = true;
  }

  emit(value: RpcLatestBlock): void {
    this.handlers?.onData(value as NewHeadsSubscriptionResult);
  }

  fail(error: Error): void {
    this.handlers?.onError?.(error);
  }
}

class FakeClientFactory implements NewHeadsClientFactory {
  readonly websocketOptions: WebSocketTransportOptions[] = [];

  constructor(
    readonly http: FakeHttpClient,
    readonly websockets: FakeWebSocketClient[],
  ) {}

  createHttp(): NewHeadsHttpClient {
    return this.http;
  }

  createWebSocket(options: WebSocketTransportOptions): NewHeadsWebSocketClient {
    this.websocketOptions.push(options);
    const websocket = this.websockets.shift();
    if (!websocket) throw new Error("Missing fake WebSocket client");
    return websocket;
  }

  transportError(error: Error): void {
    this.websocketOptions.at(-1)?.onError?.(error);
  }
}

class RpcFakeWebSocket implements WebSocketLike {
  readyState = 0;
  private readonly listeners = new Map<string, Set<WebSocketListener>>();

  constructor() {
    queueMicrotask(() => {
      this.readyState = 1;
      this.dispatch("open", {});
    });
  }

  addEventListener(type: string, listener: WebSocketListener): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: WebSocketListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  send(data: string): void {
    const request = JSON.parse(data) as { id: number; method: string };
    const result = request.method === "eth_subscribe" ? "heads" : "0x1";
    queueMicrotask(() => this.receive({ id: request.id, jsonrpc: "2.0", result }));
  }

  close(code = 1_000, reason = "closed"): void {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.dispatch("close", { code, reason });
  }

  emit(value: RpcLatestBlock): void {
    this.receive({
      jsonrpc: "2.0",
      method: "eth_subscription",
      params: { result: value, subscription: "heads" },
    });
  }

  private receive(value: unknown): void {
    this.dispatch("message", { data: JSON.stringify(value) });
  }

  private dispatch(type: string, event: WebSocketEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

type TestCallbacks = {
  errors: Error[];
  heads: HeadEvent[];
  logs: string[];
  reorgs: ReorgEvent[];
};

function createOptions(callbacks: TestCallbacks): NewHeadsOptions {
  return {
    heartbeat: { intervalMs: 1_000, method: "eth_blockNumber", timeoutMs: 100 },
    http: { url: "https://rpc.example.com" },
    onError: (error) => callbacks.errors.push(error),
    onHead: (event) => callbacks.heads.push(event),
    onLog: (message) => callbacks.logs.push(message),
    onReorg: (event) => callbacks.reorgs.push(event),
    polling: { delayBeforeStartMs: 500, fetchIntervalMs: 100 },
    reconnect: {
      delay: (attempt) => attempt * 5_000,
      maxDelayMs: 15_000,
      minDelayMs: 5_000,
    },
    websocket: { url: "wss://rpc.example.com" },
  };
}

function createCallbacks(): TestCallbacks {
  return { errors: [], heads: [], logs: [], reorgs: [] };
}

afterEach(() => vi.useRealTimers());

describe("NewHeads", () => {
  test("emits only next heads and same-height reorgs", async () => {
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const stream = new NewHeads(
      createOptions(callbacks),
      new FakeClientFactory(new FakeHttpClient(), [websocket]),
    );

    await stream.start();
    websocket.emit(block("0x10", "1"));
    websocket.emit(block("0x10", "1"));
    websocket.emit(block("0x11", "2"));
    websocket.emit(block("0x11", "3"));

    expect(callbacks.heads).toEqual([
      {
        head: expect.objectContaining({ hash: hash("1"), number: 16n }),
        source: "websocket",
        type: "head",
      },
      {
        head: expect.objectContaining({ hash: hash("2"), number: 17n }),
        source: "websocket",
        type: "head",
      },
    ]);
    expect(callbacks.reorgs).toEqual([
      {
        head: expect.objectContaining({ hash: hash("3"), number: 17n }),
        previous: expect.objectContaining({ hash: hash("2"), number: 17n }),
        source: "websocket",
        type: "reorg",
      },
    ]);
    await stream.stop();
  });

  test("ignores an older head and lets the stale timer start recovery", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const first = new FakeWebSocketClient();
    const second = new FakeWebSocketClient();
    const http = new FakeHttpClient([block("0x12", "2")]);
    const factory = new FakeClientFactory(http, [first, second]);
    const stream = new NewHeads(createOptions(callbacks), factory);

    await stream.start();
    first.emit(block("0x11", "1"));
    first.emit(block("0x10", "0"));
    expect(callbacks.heads).toHaveLength(1);
    expect(callbacks.errors).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(500);

    expect(callbacks.heads).toHaveLength(2);
    expect(callbacks.heads.at(-1)).toMatchObject({ head: { number: 18n }, source: "http" });
    expect(callbacks.errors.at(-1)?.message).toBe("No current WebSocket head received for 500ms");
    expect(first.closed).toBe(true);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(second.ethSubscribeNewHeads).toHaveBeenCalledOnce();
    second.emit(block("0x12", "3"));
    expect(callbacks.reorgs).toHaveLength(1);

    const fetchesAfterRecovery = http.ethGetBlockByTag.mock.calls.length;
    await vi.advanceTimersByTimeAsync(200);
    expect(http.ethGetBlockByTag).toHaveBeenCalledTimes(fetchesAfterRecovery);
    expect(callbacks.logs).toContain("[NewHeads] http polling stopped");
    await stream.stop();
  });

  test("repeats configured reconnect delays while polling continues", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const sockets = Array.from({ length: 5 }, () => {
      const socket = new FakeWebSocketClient();
      socket.subscribeError = new Error("connect failed");
      return socket;
    });
    const factory = new FakeClientFactory(new FakeHttpClient(), sockets);
    const stream = new NewHeads(createOptions(callbacks), factory);

    await stream.start();
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.advanceTimersByTimeAsync(10_000);
    await vi.advanceTimersByTimeAsync(15_000);
    await vi.advanceTimersByTimeAsync(15_000);

    expect(factory.websocketOptions).toHaveLength(5);
    expect(callbacks.logs.filter((message) => message.includes("reconnect scheduled"))).toEqual([
      "[NewHeads] websocket reconnect scheduled in 5000ms",
      "[NewHeads] websocket reconnect scheduled in 10000ms",
      "[NewHeads] websocket reconnect scheduled in 15000ms",
      "[NewHeads] websocket reconnect scheduled in 15000ms",
      "[NewHeads] websocket reconnect scheduled in 15000ms",
    ]);
    expect(factory.http.ethGetBlockByTag.mock.calls.length).toBeGreaterThan(1);
    await stream.stop();
  });

  test("uses heartbeat failures to start polling and reconnect", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const first = new FakeWebSocketClient();
    first.ethBlockNumber.mockRejectedValueOnce(new Error("heartbeat timeout"));
    const second = new FakeWebSocketClient();
    const factory = new FakeClientFactory(new FakeHttpClient(), [first, second]);
    const options = createOptions(callbacks);
    options.polling.delayBeforeStartMs = 2_000;
    const stream = new NewHeads(options, factory);

    await stream.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(first.ethBlockNumber).toHaveBeenCalledWith({ timeoutMs: 100 });
    expect(callbacks.errors.at(-1)?.message).toBe("heartbeat timeout");
    expect(factory.http.ethGetBlockByTag).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(5_000);
    expect(second.ethSubscribeNewHeads).toHaveBeenCalledOnce();
    await stream.stop();
  });

  test("supports net_version heartbeat", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const options = createOptions(callbacks);
    options.heartbeat.method = "net_version";
    options.polling.delayBeforeStartMs = 2_000;
    const stream = new NewHeads(options, new FakeClientFactory(new FakeHttpClient(), [websocket]));

    await stream.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(websocket.netVersion).toHaveBeenCalledWith({ timeoutMs: 100 });
    expect(websocket.ethBlockNumber).not.toHaveBeenCalled();
    await stream.stop();
  });

  test("handles subscription and fallback request errors", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const factory = new FakeClientFactory(new FakeHttpClient([new Error("http unavailable")]), [
      websocket,
    ]);
    const stream = new NewHeads(createOptions(callbacks), factory);

    await stream.start();
    websocket.fail(new Error("subscription unavailable"));
    await vi.advanceTimersByTimeAsync(0);

    expect(callbacks.errors.map((error) => error.message)).toEqual([
      "subscription unavailable",
      "http unavailable",
    ]);
    await stream.stop();
  });

  test("treats no WebSocket head as stale after the polling delay", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const first = new FakeWebSocketClient();
    const factory = new FakeClientFactory(new FakeHttpClient(), [first]);
    const stream = new NewHeads(createOptions(callbacks), factory);

    await stream.start();
    await vi.advanceTimersByTimeAsync(500);

    expect(callbacks.errors.at(-1)?.message).toBe("No current WebSocket head received for 500ms");
    expect(factory.http.ethGetBlockByTag).toHaveBeenCalledOnce();
    expect(first.closed).toBe(true);
    await stream.stop();
  });

  test("observes real RPC socket closure and starts fallback", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const socket = new RpcFakeWebSocket();
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ id: 1, jsonrpc: "2.0", result: block("0x10", "1") }),
    );
    const options = createOptions(callbacks);
    options.http = { fetch, url: "https://rpc.example.com" };
    options.websocket = { createWebSocket: () => socket, url: "wss://rpc.example.com" };
    const stream = new NewHeads(options);

    await stream.start();
    socket.emit(block("0xf", "0"));
    socket.close(1_006, "lost");
    await vi.advanceTimersByTimeAsync(0);

    expect(callbacks.errors.at(-1)?.message).toContain("(1006): lost");
    expect(fetch).toHaveBeenCalledOnce();
    await stream.stop();
  });

  test("uses the global WebSocket implementation when no factory is configured", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "WebSocket");
    const created: { socket?: RpcFakeWebSocket } = {};
    const captureSocket = (value: RpcFakeWebSocket) => {
      created.socket = value;
    };
    class NativeFakeWebSocket extends RpcFakeWebSocket {
      constructor(_url: string) {
        super();
        captureSocket(this);
      }
    }
    Object.defineProperty(globalThis, "WebSocket", {
      configurable: true,
      value: NativeFakeWebSocket,
    });

    try {
      const callbacks = createCallbacks();
      const options = createOptions(callbacks);
      const stream = new NewHeads(options);
      await stream.start();
      created.socket?.emit(block("0x1", "1"));
      expect(callbacks.heads).toHaveLength(1);
      await stream.stop();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "WebSocket", descriptor);
      else Reflect.deleteProperty(globalThis, "WebSocket");
    }
  });

  test("reports a missing global WebSocket implementation", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "WebSocket");
    Object.defineProperty(globalThis, "WebSocket", { configurable: true, value: undefined });

    try {
      const callbacks = createCallbacks();
      const stream = new NewHeads(createOptions(callbacks));
      await stream.start();
      expect(callbacks.errors.at(-1)?.message).toBe("WebSocket connection failed.");
      await stream.stop();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "WebSocket", descriptor);
      else Reflect.deleteProperty(globalThis, "WebSocket");
    }
  });

  test("async stop unsubscribes and clears polling, heartbeat, and reconnect timers", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const factory = new FakeClientFactory(new FakeHttpClient(), [websocket]);
    const stream = new NewHeads(createOptions(callbacks), factory);

    await stream.start();
    factory.transportError(new Error("transport failed"));
    await vi.advanceTimersByTimeAsync(0);
    const fetches = factory.http.ethGetBlockByTag.mock.calls.length;
    await stream.stop();
    await vi.advanceTimersByTimeAsync(30_000);

    expect(websocket.unsubscribe).not.toHaveBeenCalled();
    expect(websocket.closed).toBe(true);
    expect(factory.http.ethGetBlockByTag).toHaveBeenCalledTimes(fetches);
    expect(factory.websocketOptions).toHaveLength(1);
    expect(callbacks.logs.at(-1)).toBe("[NewHeads] stopped");
  });

  test("async stop unsubscribes a healthy subscription", async () => {
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const stream = new NewHeads(
      createOptions(callbacks),
      new FakeClientFactory(new FakeHttpClient(), [websocket]),
    );

    await stream.start();
    await stream.stop();
    expect(websocket.unsubscribe).toHaveBeenCalledOnce();
    expect(websocket.closed).toBe(true);
  });

  test("keeps start idempotent and reschedules successful heartbeats", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const factory = new FakeClientFactory(new FakeHttpClient(), [websocket]);
    const options = createOptions(callbacks);
    options.polling.delayBeforeStartMs = 10_000;
    const stream = new NewHeads(options, factory);

    await Promise.all([stream.start(), stream.start()]);
    await stream.start();
    expect(factory.websocketOptions).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(2_000);
    expect(websocket.ethBlockNumber).toHaveBeenCalledTimes(2);
    await stream.stop();
    await stream.stop();
  });

  test("reports invalid HTTP and WebSocket heads", async () => {
    vi.useFakeTimers();
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const http = new FakeHttpClient([{ hash: null, number: "0x1" }]);
    const factory = new FakeClientFactory(http, [websocket]);
    const stream = new NewHeads(createOptions(callbacks), factory);

    await stream.start();
    websocket.emit({ hash: "0x12", number: "0x1" });
    await vi.advanceTimersByTimeAsync(0);

    expect(callbacks.errors.map((error) => error.message)).toEqual([
      "Block head has an invalid hash",
      "Block head has an invalid hash",
    ]);
    await stream.stop();
  });

  test("contains failures thrown by event, error, and log callbacks", async () => {
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    const options = createOptions(callbacks);
    options.onHead = () => {
      throw new Error("head callback failed");
    };
    options.onReorg = () => {
      throw new Error("reorg callback failed");
    };
    options.onError = (error) => {
      callbacks.errors.push(error);
      throw "error reporter failed";
    };
    options.onLog = () => {
      throw new Error("logger failed");
    };
    const stream = new NewHeads(options, new FakeClientFactory(new FakeHttpClient(), [websocket]));

    await stream.start();
    websocket.emit(block("0x1", "1"));
    websocket.emit(block("0x1", "2"));
    expect(callbacks.errors.map((error) => error.message)).toEqual([
      "head callback failed",
      "reorg callback failed",
    ]);
    await stream.stop();
  });

  test("reports HTTP client creation failure", async () => {
    const callbacks = createCallbacks();
    const factory: NewHeadsClientFactory = {
      createHttp: () => {
        throw { reason: "failed" };
      },
      createWebSocket: () => new FakeWebSocketClient(),
    };
    const stream = new NewHeads(createOptions(callbacks), factory);

    await expect(stream.start()).rejects.toThrow("Failed to create HTTP client");
    expect(callbacks.errors[0]?.message).toBe("Failed to create HTTP client");
    await stream.stop();
  });

  test("cleans up a subscription that resolves after stop", async () => {
    const deferred: { resolve?: (subscription: RpcSubscription) => void } = {};
    const unsubscribe = vi.fn<RpcSubscription["unsubscribe"]>(async () => {
      throw new Error("already closed");
    });
    const websocket: NewHeadsWebSocketClient = {
      close: vi.fn<() => void>(),
      ethBlockNumber: vi.fn<NewHeadsWebSocketClient["ethBlockNumber"]>(async () => "0x1"),
      ethSubscribeNewHeads: vi.fn<NewHeadsWebSocketClient["ethSubscribeNewHeads"]>(
        () =>
          new Promise((resolve) => {
            deferred.resolve = resolve;
          }),
      ),
      netVersion: vi.fn<NewHeadsWebSocketClient["netVersion"]>(async () => "1"),
    };
    const factory = new FakeClientFactory(new FakeHttpClient(), []);
    factory.createWebSocket = () => websocket;
    const stream = new NewHeads(createOptions(createCallbacks()), factory);

    const starting = stream.start();
    const stopping = stream.stop();
    deferred.resolve?.({ id: "late", unsubscribe });
    await Promise.all([starting, stopping]);
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(websocket.close).toHaveBeenCalled();
  });

  test("reports graceful unsubscribe failure", async () => {
    const callbacks = createCallbacks();
    const websocket = new FakeWebSocketClient();
    websocket.unsubscribe.mockRejectedValueOnce("unsubscribe failed");
    const stream = new NewHeads(
      createOptions(callbacks),
      new FakeClientFactory(new FakeHttpClient(), [websocket]),
    );

    await stream.start();
    await stream.stop();
    expect(callbacks.errors.at(-1)?.message).toBe("unsubscribe failed");
  });

  test.each([
    ["heartbeat interval", (options: NewHeadsOptions) => (options.heartbeat.intervalMs = 0)],
    ["heartbeat timeout", (options: NewHeadsOptions) => (options.heartbeat.timeoutMs = 0)],
    ["polling delay", (options: NewHeadsOptions) => (options.polling.delayBeforeStartMs = -1)],
    ["polling interval", (options: NewHeadsOptions) => (options.polling.fetchIntervalMs = 0)],
    ["minimum reconnect delay", (options: NewHeadsOptions) => (options.reconnect.minDelayMs = -1)],
    ["maximum reconnect delay", (options: NewHeadsOptions) => (options.reconnect.maxDelayMs = -1)],
  ])("validates %s", (_name, mutate) => {
    const options = createOptions(createCallbacks());
    mutate(options);
    expect(() => new NewHeads(options)).toThrow(/safe integer/);
  });

  test("rejects reconnect bounds in reverse order", () => {
    const options = createOptions(createCallbacks());
    options.reconnect.minDelayMs = 20;
    options.reconnect.maxDelayMs = 10;
    expect(() => new NewHeads(options)).toThrow(
      "Maximum reconnect delay must be greater than or equal to minimum delay",
    );
  });
});
