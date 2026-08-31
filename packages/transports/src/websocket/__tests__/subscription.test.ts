import { expect, test } from "vitest";

import { RpcResponseError } from "../../errors/index.js";
import { WebSocketTransport } from "../transport.js";
import { FakeWebSocket } from "./fake-websocket.js";

test("rejects invalid subscription ids", async () => {
  const socket = new FakeWebSocket({
    onSend: (request, current) => queueMicrotask(() => current.respond(request.id, 123)),
  });
  const transport = createTransport(socket);

  await expect(
    transport.subscribe({ params: ["newHeads"], onData: () => undefined }),
  ).rejects.toBeInstanceOf(RpcResponseError);
  transport.close();
});

test("reports subscription callback failures", async () => {
  const globalErrors: Error[] = [];
  const localErrors: Error[] = [];
  const socket = new FakeWebSocket();
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
    onError: (error) => globalErrors.push(error),
  });
  const subscription = await transport.subscribe({
    params: ["newHeads"],
    onData: () => {
      throw "callback failed";
    },
    onError: (error) => localErrors.push(error),
  });

  socket.receive({
    jsonrpc: "2.0",
    method: "eth_subscription",
    params: { subscription: subscription.id, result: { number: "0x2" } },
  });

  expect(localErrors[0]?.message).toBe("callback failed");
  expect(globalErrors[0]?.message).toBe("callback failed");
  transport.close();
});

test("removes subscription locally before unsubscribe response", async () => {
  const values: unknown[] = [];
  const socket = new FakeWebSocket();
  const transport = createTransport(socket);
  const subscription = await transport.subscribe({
    params: ["newHeads"],
    onData: (value) => values.push(value),
  });
  const id = subscription.id;

  await expect(subscription.unsubscribe()).resolves.toBe(true);
  socket.receive({
    jsonrpc: "2.0",
    method: "eth_subscription",
    params: { subscription: id, result: { number: "0x2" } },
  });

  expect(values).toEqual([]);
  transport.close();
});

function createTransport(socket: FakeWebSocket): WebSocketTransport {
  return new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
    retry: false,
  });
}
