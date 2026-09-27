import { expect, test } from "vitest";

import {
  RpcAbortError,
  RpcTimeoutError,
  WebSocketClosedError,
  WebSocketStoppedError,
} from "../../errors/index.js";
import { WebSocketTransport } from "../transport.js";
import { FakeWebSocket } from "./fake-websocket.js";

type ChainId = {
  method: "eth_chainId";
  params?: undefined;
  result: `0x${string}`;
};

test("requests, subscribes, and unsubscribes", async () => {
  const socket = new FakeWebSocket();
  const values: unknown[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).resolves.toBe("0x1");
  const subscription = await transport.subscribe({
    params: ["newHeads"],
    onData: (value) => values.push(value),
  });
  socket.receive({
    jsonrpc: "2.0",
    method: "eth_subscription",
    params: { subscription: subscription.id, result: { number: "0x2" } },
  });

  expect(values).toEqual([{ number: "0x2" }]);
  await expect(subscription.unsubscribe()).resolves.toBe(true);
  transport.close();
});

test("reconnects and restores subscriptions", async () => {
  const sockets: FakeWebSocket[] = [];
  const values: unknown[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({ subscriptionId: `subscription-${sockets.length + 1}` });
      sockets.push(socket);
      return socket;
    },
  });

  const subscription = await transport.subscribe({
    params: ["newHeads"],
    onData: (value) => values.push(value),
  });
  sockets[0]?.disconnect();
  await waitFor(() => subscription.id === "subscription-2");
  sockets[1]?.receive({
    jsonrpc: "2.0",
    method: "eth_subscription",
    params: { subscription: subscription.id, result: { number: "0x3" } },
  });

  expect(values).toEqual([{ number: "0x3" }]);
  transport.close();
});

test("retries failed subscription restoration", async () => {
  const errors: Error[] = [];
  const sockets: FakeWebSocket[] = [];
  let restoreAttempts = 0;
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({
        onSend: (request, current) => {
          if (request.method !== "eth_subscribe") {
            queueMicrotask(() => current.respond(request.id, true));
            return;
          }
          restoreAttempts += 1;
          const result = restoreAttempts === 2 ? 123 : `subscription-${restoreAttempts}`;
          queueMicrotask(() => current.respond(request.id, result));
        },
      });
      sockets.push(socket);
      return socket;
    },
    onError: (error) => errors.push(error),
    reconnect: { delayMs: 0 },
  });
  const subscription = await transport.subscribe({
    params: ["newHeads"],
    onData: () => undefined,
    onError: (error) => errors.push(error),
  });

  sockets[0]?.disconnect();
  await waitFor(() => subscription.id === "subscription-3");

  expect(restoreAttempts).toBe(3);
  // Reported once to the subscription and once to the transport.
  expect(errors).toHaveLength(2);
  expect(errors[0]).toBe(errors[1]);
  transport.close();
});

test("keeps reconnecting until the endpoint recovers", async () => {
  const errors: Error[] = [];
  const sockets: FakeWebSocket[] = [];
  let down = false;
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({
        autoOpen: !down,
        subscriptionId: `subscription-${sockets.length + 1}`,
      });
      if (down) queueMicrotask(() => socket.disconnect());
      sockets.push(socket);
      return socket;
    },
    onError: (error) => errors.push(error),
    reconnect: { delayMs: 0 },
  });
  const subscription = await transport.subscribe({ params: ["newHeads"], onData: () => undefined });

  down = true;
  sockets[0]?.disconnect();
  await waitFor(() => sockets.length > 10);
  down = false;
  await waitFor(() => subscription.id !== undefined);

  expect(subscription.id).toBe(`subscription-${sockets.length}`);
  expect(errors.length).toBeGreaterThan(5);
  transport.close();
});

test("does not resurrect a subscription removed during restoration", async () => {
  const sockets: FakeWebSocket[] = [];
  const values: unknown[] = [];
  let release: (() => void) | undefined;
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({
        onSend: (request, current) => {
          const result =
            request.method === "eth_subscribe" ? `subscription-${sockets.length}` : true;
          if (request.method === "eth_subscribe" && sockets.length > 1) {
            release = () => current.respond(request.id, result);
          } else {
            queueMicrotask(() => current.respond(request.id, result));
          }
        },
      });
      sockets.push(socket);
      return socket;
    },
    reconnect: { delayMs: 0 },
  });
  const subscription = await transport.subscribe({
    params: ["newHeads"],
    onData: (value) => values.push(value),
  });

  sockets[0]?.disconnect();
  await waitFor(() => sockets[1]?.sent.some((r) => r.method === "eth_subscribe") === true);
  await subscription.unsubscribe();
  release?.();
  await waitFor(() => sockets[1]?.sent.some((r) => r.method === "eth_unsubscribe") === true);
  sockets[1]?.receive({
    jsonrpc: "2.0",
    method: "eth_subscription",
    params: { subscription: "subscription-2", result: { number: "0x3" } },
  });

  expect(sockets[1]?.sent.find((r) => r.method === "eth_unsubscribe")?.params).toEqual([
    "subscription-2",
  ]);
  expect(values).toEqual([]);
  expect(subscription.id).toBeUndefined();
  transport.close();
});

test("restores subscriptions on the next connection when reconnect is disabled", async () => {
  const sockets: FakeWebSocket[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({ subscriptionId: `subscription-${sockets.length + 1}` });
      sockets.push(socket);
      return socket;
    },
    reconnect: false,
  });
  const subscription = await transport.subscribe({ params: ["newHeads"], onData: () => undefined });

  sockets[0]?.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(sockets).toHaveLength(1);
  expect(subscription.id).toBeUndefined();

  await transport.request<ChainId>({ method: "eth_chainId" });
  await waitFor(() => subscription.id === "subscription-2");
  transport.close();
});

test("stops reconnecting when closed", async () => {
  const sockets: FakeWebSocket[] = [];
  let down = false;
  const errors: Error[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({ autoOpen: !down });
      if (down) queueMicrotask(() => socket.disconnect());
      sockets.push(socket);
      return socket;
    },
    onError: (error) => errors.push(error),
    reconnect: { delayMs: 5, maxDelayMs: 5 },
  });
  await transport.subscribe({ params: ["newHeads"], onData: () => undefined });

  down = true;
  sockets[0]?.disconnect();
  await waitFor(() => sockets.length > 2);
  transport.close();
  const count = sockets.length;
  const reported = errors.length;
  await new Promise((resolve) => setTimeout(resolve, 30));

  expect(sockets).toHaveLength(count);
  expect(errors).toHaveLength(reported);
});

test.each([{ retries: -1 }, { retries: 1.5 }, { delayMs: -1 }, { factor: 0.5 }])(
  "rejects invalid reconnect options %o",
  (reconnect) => {
    expect(() => new WebSocketTransport({ url: "ws://rpc.example.com", reconnect })).toThrow(
      RangeError,
    );
  },
);

test("one caller aborting does not fail the other callers of a shared connection", async () => {
  const sockets: FakeWebSocket[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({ autoOpen: false });
      sockets.push(socket);
      return socket;
    },
  });
  const controller = new AbortController();

  const first = transport.connect({ signal: controller.signal });
  const second = transport.connect();
  controller.abort("stop");
  await expect(first).rejects.toBeInstanceOf(RpcAbortError);
  sockets[0]?.open();

  await expect(second).resolves.toBeUndefined();
  expect(sockets).toHaveLength(1);
  transport.close();
});

test("keeps the shared connection attempt after a caller times out", async () => {
  const sockets: FakeWebSocket[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => {
      const socket = new FakeWebSocket({ autoOpen: false });
      sockets.push(socket);
      return socket;
    },
  });

  await expect(transport.connect({ timeoutMs: 1 })).rejects.toBeInstanceOf(RpcTimeoutError);
  sockets[0]?.open();
  await transport.connect();

  expect(transport.connected).toBe(true);
  expect(sockets).toHaveLength(1);
  transport.close();
});

test("rejects callers waiting for a connection when closed", async () => {
  const socket = new FakeWebSocket({ autoOpen: false });
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
  });

  const connecting = transport.connect();
  transport.close();

  await expect(connecting).rejects.toBeInstanceOf(WebSocketClosedError);
  expect(socket.readyState).toBe(3);
});

test("rejects pending and future requests when closed", async () => {
  const socket = new FakeWebSocket({ onSend: () => undefined });
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
    retry: false,
  });
  const pending = transport.request<ChainId>({ method: "eth_chainId" });
  await waitFor(() => socket.sent.length === 1);

  transport.close();

  await expect(pending).rejects.toBeInstanceOf(WebSocketClosedError);
  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toBeInstanceOf(
    WebSocketStoppedError,
  );
  await expect(
    transport.subscribe({ params: ["newHeads"], onData: () => undefined }),
  ).rejects.toBeInstanceOf(WebSocketStoppedError);
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 500;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("Condition not met.");
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}
