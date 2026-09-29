import type {
  HttpTransportOptions,
  NewHeadsSubscriptionResult,
  RpcSubscription,
  SubscriptionHandlers,
  WebSocketTransportOptions,
} from "@purevm/rpc-public";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { NewBlocks } from "../new-blocks.js";
import type {
  NewBlocksClientFactory,
  NewBlocksEvent,
  NewBlocksHttpClient,
  NewBlocksOptions,
  NewBlocksWebSocketClient,
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
  subscribeError?: Error;
  readonly close = vi.fn<() => void>();
  readonly unsubscribe = vi.fn<RpcSubscription["unsubscribe"]>(async () => true);

  async ethSubscribeNewHeads(
    handlers: SubscriptionHandlers<NewHeadsSubscriptionResult>,
  ): Promise<RpcSubscription> {
    if (this.subscribeError) throw this.subscribeError;
    this.handlers = handlers;
    return { id: "heads", unsubscribe: this.unsubscribe };
  }

  emit(value: RpcLatestBlock): void {
    this.handlers?.onData(value as NewHeadsSubscriptionResult);
  }

  fail(error: Error): void {
    this.handlers?.onError?.(error);
  }
}

class FakeClientFactory implements NewBlocksClientFactory {
  readonly http = new FakeHttpClient();
  readonly sockets: FakeWebSocketClient[] = [new FakeWebSocketClient()];
  readonly httpOptions: HttpTransportOptions[] = [];
  readonly websocketOptions: WebSocketTransportOptions[] = [];
  private socketIndex = 0;

  createHttp(options: HttpTransportOptions): NewBlocksHttpClient {
    this.httpOptions.push(options);
    return this.http;
  }

  createWebSocket(options: WebSocketTransportOptions): NewBlocksWebSocketClient {
    this.websocketOptions.push(options);
    const socket = this.sockets[this.socketIndex++];
    if (!socket) throw new Error("No fake WebSocket configured");
    return socket;
  }

  socket(index = 0): FakeWebSocketClient {
    const socket = this.sockets[index];
    if (!socket) throw new Error(`No fake WebSocket ${index}`);
    return socket;
  }
}

type Recorded = { errors: Error[]; events: NewBlocksEvent[]; logs: string[] };

function setup(overrides: Partial<NewBlocksOptions> = {}) {
  const recorded: Recorded = { errors: [], events: [], logs: [] };
  const clients = new FakeClientFactory();
  const stream = new NewBlocks(
    {
      http: { url: "https://http.example.com" },
      onError: (error) => recorded.errors.push(error),
      onEvent: (event) => recorded.events.push(event),
      onLog: (message) => recorded.logs.push(message),
      polling: { intervalMs: 100, staleAfterMs: 500 },
      reconnect: { delay: (attempt) => attempt * 100, maxDelayMs: 300, minDelayMs: 50 },
      websocket: { url: "wss://ws.example.com" },
      ...overrides,
    },
    clients,
  );
  return { clients, recorded, stream };
}

/** Compact view of events: `type:number:source`, plus the kind for reorgs. */
function summary(events: readonly NewBlocksEvent[]): string[] {
  return events.map((event) => {
    const base = `${event.type}:${event.block.number}:${event.source}`;
    return event.type === "reorg" ? `${base}:${event.kind}` : base;
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("NewBlocks classification", () => {
  test("emits consecutive blocks and drops duplicates", async () => {
    const { clients, recorded, stream } = setup();
    await stream.start();
    const socket = clients.socket();

    socket.emit(block(11, "b", "a"));
    socket.emit(block(11, "b", "a"));
    socket.emit(block(12, "c", "b"));
    socket.emit(block(10, "a", "0"));
    await vi.advanceTimersByTimeAsync(0);

    expect(summary(recorded.events)).toEqual([
      "block:10:http",
      "block:11:websocket",
      "block:12:websocket",
    ]);
    expect(recorded.logs.filter((log) => log.includes("ignored duplicate"))).toHaveLength(2);
    expect(stream.head?.hash).toBe(hash("c"));
    await stream.stop();
  });

  test("reports replacements at and below the head", async () => {
    const { clients, recorded, stream } = setup();
    await stream.start();
    const socket = clients.socket();
    socket.emit(block(11, "b", "a"));
    socket.emit(block(12, "c", "b"));

    socket.emit(block(12, "e", "b"));
    socket.emit(block(11, "f", "a"));
    socket.emit(block(12, "1", "f"));
    await vi.advanceTimersByTimeAsync(0);

    expect(summary(recorded.events).slice(3)).toEqual([
      "reorg:12:websocket:replacement",
      "reorg:11:websocket:replacement",
      "block:12:websocket",
    ]);
    const [atHead, belowHead] = recorded.events.slice(3);
    expect(atHead).toMatchObject({ previous: { hash: hash("c") }, replaced: { hash: hash("c") } });
    expect(belowHead).toMatchObject({
      previous: { hash: hash("e") },
      replaced: { hash: hash("b") },
    });
    await stream.stop();
  });

  test("reports a next height that does not extend the head", async () => {
    const { clients, recorded, stream } = setup();
    await stream.start();

    clients.socket().emit(block(11, "b", "f"));
    await vi.advanceTimersByTimeAsync(0);

    expect(summary(recorded.events)).toEqual([
      "block:10:http",
      "reorg:11:websocket:parent-mismatch",
    ]);
    expect(recorded.events[1]).toMatchObject({ previous: { hash: hash("a") } });
    await stream.stop();
  });
});

describe("NewBlocks gaps", () => {
  test("reports skipped heights without fetching them and continues from the new head", async () => {
    const { clients, recorded, stream } = setup();
    await stream.start();
    const socket = clients.socket();

    socket.emit(block(13, "d", "c"));
    socket.emit(block(14, "e", "d"));

    expect(summary(recorded.events)).toEqual([
      "block:10:http",
      "gap:13:websocket",
      "block:14:websocket",
    ]);
    expect(recorded.events[1]).toMatchObject({
      missing: { count: 2n, from: 11n, to: 12n },
      previous: { number: 10n },
    });
    expect(clients.http.ethGetBlockByTag).toHaveBeenCalledOnce();
    await stream.stop();
  });
});

describe("NewBlocks recovery", () => {
  test("polls over HTTP after staleAfterMs of silence and reconnects the WebSocket", async () => {
    const { clients, recorded, stream } = setup();
    clients.sockets.push(new FakeWebSocketClient());
    await stream.start();

    await vi.advanceTimersByTimeAsync(499);
    expect(recorded.errors).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(recorded.errors.map((error) => error.message)).toEqual([
      "No new WebSocket block received for 500ms",
    ]);
    expect(clients.socket(0).close).toHaveBeenCalled();

    clients.http.latest = block(11, "b", "a");
    await vi.advanceTimersByTimeAsync(100);
    expect(summary(recorded.events)).toEqual(["block:10:http", "block:11:http"]);
    expect(clients.websocketOptions).toHaveLength(2);

    const httpCalls = clients.http.ethGetBlockByTag.mock.calls.length;
    clients.socket(1).emit(block(12, "c", "b"));
    await vi.advanceTimersByTimeAsync(400);

    expect(summary(recorded.events).at(-1)).toBe("block:12:websocket");
    expect(recorded.logs).toContain("[NewBlocks] http polling stopped");
    expect(clients.http.ethGetBlockByTag.mock.calls.length).toBe(httpCalls);
    await stream.stop();
  });

  test("does not treat an older WebSocket header as proof of freshness", async () => {
    const { clients, recorded, stream } = setup();
    await stream.start();

    await vi.advanceTimersByTimeAsync(400);
    clients.socket().emit(block(9, "9", "8"));
    await vi.advanceTimersByTimeAsync(100);

    expect(recorded.errors.map((error) => error.message)).toEqual([
      "No new WebSocket block received for 500ms",
    ]);
    await stream.stop();
  });

  test("reconnects after a subscription error with the configured delay", async () => {
    const { clients, recorded, stream } = setup();
    clients.sockets.push(new FakeWebSocketClient());
    await stream.start();

    clients.socket(0).fail(new Error("subscription dropped"));
    await vi.advanceTimersByTimeAsync(99);
    expect(clients.websocketOptions).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);

    expect(clients.websocketOptions).toHaveLength(2);
    expect(recorded.errors.map((error) => error.message)).toEqual(["subscription dropped"]);
    expect(recorded.logs).toContain("[NewBlocks] http polling started");
    await stream.stop();
  });

  test("retries a failed subscription on the next socket", async () => {
    const { clients, recorded, stream } = setup();
    clients.socket(0).subscribeError = new Error("handshake failed");
    clients.sockets.push(new FakeWebSocketClient());
    await stream.start();

    await vi.advanceTimersByTimeAsync(100);
    clients.socket(1).emit(block(11, "b", "a"));
    await vi.advanceTimersByTimeAsync(0);

    expect(recorded.errors.map((error) => error.message)).toEqual(["handshake failed"]);
    expect(summary(recorded.events).at(-1)).toBe("block:11:websocket");
    await stream.stop();
  });

  test("uses the HTTP endpoint separately and owns WebSocket recovery", async () => {
    const { clients, stream } = setup({
      websocket: { heartbeat: { intervalMs: 5_000 }, url: "wss://ws.example.com" },
    });
    await stream.start();

    expect(clients.httpOptions).toEqual([{ url: "https://http.example.com" }]);
    expect(clients.websocketOptions[0]).toMatchObject({
      heartbeat: { intervalMs: 5_000 },
      reconnect: false,
      retry: false,
      url: "wss://ws.example.com",
    });
    await stream.stop();
  });
});

describe("NewBlocks lifecycle", () => {
  test("start and stop are idempotent and nothing is emitted after stop", async () => {
    const { clients, recorded, stream } = setup();
    await Promise.all([stream.start(), stream.start()]);
    const socket = clients.socket();

    await Promise.all([stream.stop(), stream.stop()]);
    socket.emit(block(11, "b", "a"));
    await vi.advanceTimersByTimeAsync(1_000);

    expect(summary(recorded.events)).toEqual(["block:10:http"]);
    expect(socket.unsubscribe).toHaveBeenCalledOnce();
    expect(socket.close).toHaveBeenCalled();
    expect(stream.head).toBeUndefined();
  });

  test("ignores a replaced socket that still emits", async () => {
    const { clients, recorded, stream } = setup();
    clients.sockets.push(new FakeWebSocketClient());
    await stream.start();
    const old = clients.socket(0);
    old.fail(new Error("subscription dropped"));
    await vi.advanceTimersByTimeAsync(100);

    old.emit(block(11, "b", "a"));
    old.fail(new Error("late failure"));
    await vi.advanceTimersByTimeAsync(0);

    expect(summary(recorded.events)).toEqual(["block:10:http"]);
    expect(recorded.errors.map((error) => error.message)).toEqual(["subscription dropped"]);
    expect(clients.websocketOptions).toHaveLength(2);
    await stream.stop();
  });

  test("ignores start while running and stop during start", async () => {
    const { clients, stream } = setup();
    await stream.start();
    await stream.start();
    expect(clients.httpOptions).toHaveLength(1);
    await stream.stop();

    const restarted = setup();
    const starting = restarted.stream.start();
    await restarted.stream.stop();
    await starting;
    expect(restarted.stream.head).toBeUndefined();
  });

  test("reports consumer callback failures without stopping the stream", async () => {
    const { clients, recorded, stream } = setup({
      onEvent: () => {
        throw new Error("consumer failed");
      },
    });
    await stream.start();
    clients.socket().emit(block(11, "b", "a"));
    await vi.advanceTimersByTimeAsync(0);

    expect(recorded.errors.map((error) => error.message)).toEqual([
      "consumer failed",
      "consumer failed",
    ]);
    expect(stream.head?.number).toBe(11n);
    await stream.stop();
  });

  test("reports invalid HTTP headers and keeps streaming", async () => {
    const { clients, recorded, stream } = setup();
    clients.http.latest = { ...block(10, "a", "0"), hash: "0x1" };
    await stream.start();

    clients.socket().emit(block(10, "a", "0"));
    await vi.advanceTimersByTimeAsync(0);

    expect(recorded.errors.map((error) => error.message)).toEqual([
      "Block header has an invalid hash",
    ]);
    expect(summary(recorded.events)).toEqual(["block:10:websocket"]);
    await stream.stop();
  });

  test.each([
    [
      () => {
        throw new Error("delay failed");
      },
      "delay failed",
    ],
    [() => Number.NaN, "Reconnect delay function must return a finite number"],
  ])("falls back to minDelayMs when the reconnect delay is unusable %#", async (delay, message) => {
    const { clients, recorded, stream } = setup({
      reconnect: { delay, maxDelayMs: 300, minDelayMs: 50 },
    });
    clients.sockets.push(new FakeWebSocketClient());
    await stream.start();

    clients.socket(0).fail(new Error("subscription dropped"));
    await vi.advanceTimersByTimeAsync(50);

    expect(recorded.errors.map((error) => error.message)).toEqual([
      "subscription dropped",
      message,
    ]);
    expect(clients.websocketOptions).toHaveLength(2);
    await stream.stop();
  });

  test("logs a failing error callback instead of throwing", async () => {
    const logs: string[] = [];
    const { clients, stream } = setup({
      onError: () => {
        throw new Error("sink down");
      },
      onLog: (message) => logs.push(message),
    });
    await stream.start();

    clients.socket().fail(new Error("subscription dropped"));

    expect(logs).toContain("[NewBlocks] error callback failed: sink down");
    await stream.stop();
  });

  test("rejects start when the HTTP client cannot be created", async () => {
    const { clients, recorded, stream } = setup();
    vi.spyOn(clients, "createHttp").mockImplementation(() => {
      throw new Error("bad http options");
    });

    await expect(stream.start()).rejects.toThrow("bad http options");
    expect(recorded.errors.map((error) => error.message)).toEqual(["bad http options"]);
    await stream.stop();
  });

  test.each([
    [{ polling: { staleAfterMs: 0 } }, "WebSocket stale timeout"],
    [{ polling: { intervalMs: 0, staleAfterMs: 1 } }, "Polling interval"],
    [{ historySize: 0 }, "History size"],
    [
      { reconnect: { delay: () => 1, maxDelayMs: 1, minDelayMs: 2 } },
      "Maximum reconnect delay must be greater",
    ],
  ] as const)("rejects invalid configuration %#", (overrides, message) => {
    expect(() => setup(overrides as Partial<NewBlocksOptions>)).toThrow(message);
  });
});
