import type {
  NewHeadsSubscriptionResult,
  RpcSubscription,
  SubscriptionHandlers,
  WebSocketEvent,
  WebSocketLike,
  WebSocketListener,
  WebSocketTransportOptions,
} from "@purevm/public";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { NewBlocksWebSocketClient } from "../types.js";
import { WebSocketSession, type WebSocketSessionOptions } from "../websocket-session.js";

class FakeSocket implements WebSocketLike {
  readonly readyState = 1;
  private readonly listeners = new Map<string, WebSocketListener[]>();

  addEventListener(type: string, listener: WebSocketListener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  removeEventListener(): void {}

  send(): void {}

  close(): void {}

  emit(type: string, event: WebSocketEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

/** Client that opens its socket through the factory the session provides, like the real one. */
class ObservedClient implements NewBlocksWebSocketClient {
  handlers?: SubscriptionHandlers<NewHeadsSubscriptionResult>;
  socket?: WebSocketLike;
  subscribe: () => Promise<RpcSubscription> = async () => ({
    id: "heads",
    unsubscribe: this.unsubscribe,
  });
  readonly close = vi.fn<() => void>();
  readonly unsubscribe = vi.fn<RpcSubscription["unsubscribe"]>(async () => true);
  readonly options: WebSocketTransportOptions;

  constructor(options: WebSocketTransportOptions) {
    this.options = options;
    this.socket = options.createWebSocket?.(options.url);
  }

  async ethSubscribeNewHeads(
    handlers: SubscriptionHandlers<NewHeadsSubscriptionResult>,
  ): Promise<RpcSubscription> {
    this.handlers = handlers;
    return this.subscribe();
  }
}

function setup(
  overrides: Partial<WebSocketSessionOptions> = {},
  subscribe?: (client: ObservedClient) => Promise<RpcSubscription>,
) {
  const socket = new FakeSocket();
  const failures: Error[] = [];
  let client: ObservedClient | undefined;
  const session = new WebSocketSession({
    createClient: (options) => {
      const created = new ObservedClient(options);
      if (subscribe) created.subscribe = () => subscribe(created);
      client = created;
      return created;
    },
    onFailure: (error) => failures.push(error),
    onHead: () => true,
    staleAfterMs: 500,
    websocket: { createWebSocket: () => socket, url: "wss://ws.example.com" },
    ...overrides,
  });
  return { client: () => client, failures, session, socket };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("WebSocketSession", () => {
  test("fails once when the socket closes", async () => {
    const { failures, session, socket } = setup();
    await session.start();

    socket.emit("close", { code: 1006, reason: "gone" });
    socket.emit("close", {});

    expect(failures.map((error) => error.message)).toEqual([
      "WebSocket connection closed (1006): gone.",
    ]);
  });

  test("fails on transport errors and on invalid headers", async () => {
    const transport = setup();
    await transport.session.start();
    transport.client()?.options.onError?.(new Error("transport down"));
    expect(transport.failures.map((error) => error.message)).toEqual(["transport down"]);

    const invalid = setup({
      onHead: () => {
        throw new Error("Block header has an invalid hash");
      },
    });
    await invalid.session.start();
    invalid.client()?.handlers?.onData({} as NewHeadsSubscriptionResult);
    expect(invalid.failures.map((error) => error.message)).toEqual([
      "Block header has an invalid hash",
    ]);
  });

  test("discards a subscription that completes after stop", async () => {
    let release: (() => void) | undefined;
    const { client, session } = setup({}, (created) => {
      return new Promise((resolve) => {
        release = () => resolve({ id: "late", unsubscribe: created.unsubscribe });
      });
    });

    const starting = session.start();
    await vi.advanceTimersByTimeAsync(0);
    const current = client();
    await session.stop();
    expect(current?.unsubscribe).not.toHaveBeenCalled();

    release?.();
    await starting;

    expect(current?.unsubscribe).toHaveBeenCalledOnce();
    expect(current?.close).toHaveBeenCalled();
  });

  test("reports a missing platform WebSocket", async () => {
    vi.stubGlobal("WebSocket", undefined);
    const { failures, session } = setup({ websocket: { url: "wss://ws.example.com" } });

    await expect(session.start()).rejects.toThrow("No WebSocket implementation available.");
    expect(failures).toHaveLength(1);
  });
});
