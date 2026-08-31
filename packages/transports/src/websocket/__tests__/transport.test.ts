import { expect, test } from "vitest";

import { WebSocketClosedError } from "../../errors/index.js";
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
    WebSocketClosedError,
  );
  await expect(
    transport.subscribe({ params: ["newHeads"], onData: () => undefined }),
  ).rejects.toBeInstanceOf(WebSocketClosedError);
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 500;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("Condition not met.");
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}
