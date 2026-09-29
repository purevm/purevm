import { expect, test, vi } from "vitest";

import { WebSocketConnectionError } from "../../errors/index.js";
import { WebSocketTransport } from "../transport.js";
import type { WebSocketTransportOptions } from "../types.js";
import { FakeWebSocket, type FakeWebSocketOptions } from "./fake-websocket.js";

function setup(
  options: Partial<WebSocketTransportOptions> = {},
  socketOptions: FakeWebSocketOptions = {},
) {
  const sockets: FakeWebSocket[] = [];
  const errors: Error[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({
        subscriptionId: `subscription-${sockets.length + 1}`,
        ...socketOptions,
      });
      sockets.push(socket);
      return socket;
    },
    onError: (error) => errors.push(error),
    reconnect: { delayMs: 0 },
    heartbeat: { intervalMs: 100, timeoutMs: 50 },
    ...options,
  });
  const pings = (index = 0) =>
    (sockets[index]?.sent ?? []).filter((request) => request.method !== "eth_subscribe");
  return { errors, pings, sockets, transport };
}

test.each(["eth_chainId", "net_version", "eth_blockNumber"] as const)(
  "probes an idle connection with %s",
  async (method) => {
    const { pings, transport } = setup({ heartbeat: { intervalMs: 100, method } });
    await transport.connect();

    await vi.advanceTimersByTimeAsync(99);
    expect(pings()).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(pings().map((request) => request.method)).toEqual([method]);
    await vi.advanceTimersByTimeAsync(100);
    expect(pings()).toHaveLength(2);
    expect(transport.connected).toBe(true);
    transport.close();
  },
);

test("does not probe while messages arrive", async () => {
  const { pings, sockets, transport } = setup();
  const subscription = await transport.subscribe({ params: ["newHeads"], onData: () => undefined });

  for (let index = 0; index < 10; index += 1) {
    await vi.advanceTimersByTimeAsync(50);
    sockets[0]?.receive({
      jsonrpc: "2.0",
      method: "eth_subscription",
      params: { subscription: subscription.id, result: {} },
    });
  }

  expect(pings()).toHaveLength(0);
  transport.close();
});

test("drops an unresponsive connection and restores subscriptions", async () => {
  const { errors, sockets, transport } = setup(
    {},
    {
      onSend: (request, socket) => {
        if (request.method === "eth_subscribe") {
          queueMicrotask(() => socket.respond(request.id, "subscription-1"));
        }
      },
    },
  );
  const subscription = await transport.subscribe({ params: ["newHeads"], onData: () => undefined });

  await vi.advanceTimersByTimeAsync(150);

  expect(sockets[0]?.readyState).toBe(3);
  expect(errors[0]).toBeInstanceOf(WebSocketConnectionError);
  expect(errors[0]?.message).toBe("WebSocket heartbeat failed.");
  expect(sockets).toHaveLength(2);
  expect(subscription.id).toBe("subscription-1");
  expect(transport.connected).toBe(true);
  transport.close();
});

test("treats a provider error as a live connection", async () => {
  const { errors, sockets, transport } = setup(
    { heartbeat: { intervalMs: 100, method: "net_version" } },
    {
      onSend: (request, socket) => {
        queueMicrotask(() => socket.reject(request.id, -32_601, "Method not found"));
      },
    },
  );
  await transport.connect();

  await vi.advanceTimersByTimeAsync(350);

  expect(sockets).toHaveLength(1);
  expect(sockets[0]?.sent).toHaveLength(3);
  expect(errors).toEqual([]);
  transport.close();
});

test("can be disabled", async () => {
  const { pings, transport } = setup({ heartbeat: false });
  await transport.connect();

  await vi.advanceTimersByTimeAsync(60_000);

  expect(pings()).toHaveLength(0);
  transport.close();
});

test("stops probing when closed", async () => {
  const { pings, transport } = setup();
  await transport.connect();
  transport.close();

  await vi.advanceTimersByTimeAsync(1_000);

  expect(pings()).toHaveLength(0);
});

test.each([{ intervalMs: 0 }, { timeoutMs: -1 }, { intervalMs: 1.5 }, { intervalMs: 2 ** 31 }])(
  "rejects invalid heartbeat timing %o",
  (heartbeat) => {
    expect(() => new WebSocketTransport({ url: "ws://rpc.example.com", heartbeat })).toThrow(
      RangeError,
    );
  },
);

test("rejects unknown heartbeat methods", () => {
  expect(
    () =>
      new WebSocketTransport({
        url: "ws://rpc.example.com",
        heartbeat: { method: "eth_gasPrice" as "eth_chainId" },
      }),
  ).toThrow(TypeError);
});
