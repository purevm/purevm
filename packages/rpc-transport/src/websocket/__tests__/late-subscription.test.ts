import { expect, test, vi } from "vitest";

import { RpcTimeoutError } from "../../errors/index.js";
import { LATE_SUBSCRIPTION_TTL_MS } from "../late-subscriptions.js";
import { WebSocketTransport } from "../transport.js";
import { FakeWebSocket, type FakeRequest } from "./fake-websocket.js";

/** Answers `eth_subscribe` after `delayMs`, everything else immediately. */
function setup(delaysMs: readonly number[]) {
  const socket = new FakeWebSocket({
    onSend: (request, current) => {
      if (request.method !== "eth_subscribe") {
        queueMicrotask(() => current.respond(request.id, true));
        return;
      }
      const attempt = subscribes.length;
      subscribes.push(request);
      setTimeout(
        () => current.respond(request.id, `subscription-${attempt + 1}`),
        delaysMs[attempt] ?? 0,
      );
    },
  });
  const subscribes: FakeRequest[] = [];
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
    heartbeat: false,
  });
  const unsubscribed = () =>
    socket.sent.filter((request) => request.method === "eth_unsubscribe").map((r) => r.params);
  return { socket, transport, unsubscribed };
}

test("unsubscribes a subscription created after its request timed out", async () => {
  const { transport, unsubscribed } = setup([50]);

  const subscribing = transport.subscribe(
    { params: ["newHeads"], onData: () => undefined },
    { retry: false, timeoutMs: 10 },
  );
  const outcome = subscribing.catch((error: unknown) => error);
  await vi.advanceTimersByTimeAsync(10);
  expect(await outcome).toBeInstanceOf(RpcTimeoutError);
  await vi.advanceTimersByTimeAsync(40);

  expect(unsubscribed()).toEqual([["subscription-1"]]);
  transport.close();
});

test("keeps the retried subscription and releases the late one", async () => {
  const { transport, unsubscribed } = setup([50, 0]);

  const subscribing = transport.subscribe(
    { params: ["newHeads"], onData: () => undefined },
    { retry: { delayMs: 0, retries: 1 }, timeoutMs: 10 },
  );
  await vi.advanceTimersByTimeAsync(50);
  const subscription = await subscribing;

  expect(subscription.id).toBe("subscription-2");
  expect(unsubscribed()).toEqual([["subscription-1"]]);
  transport.close();
});

test("ignores late responses after the socket closed", async () => {
  const { socket, transport, unsubscribed } = setup([50]);

  const subscribing = transport.subscribe(
    { params: ["newHeads"], onData: () => undefined },
    { retry: false, timeoutMs: 10 },
  );
  const outcome = subscribing.catch((error: unknown) => error);
  await vi.advanceTimersByTimeAsync(10);
  expect(await outcome).toBeInstanceOf(RpcTimeoutError);
  const request = socket.sent[0];
  socket.disconnect();
  if (request) socket.respond(request.id, "subscription-1");

  expect(unsubscribed()).toEqual([]);
  transport.close();
});

test("forgets abandoned requests after the retention period", async () => {
  const { transport, unsubscribed } = setup([LATE_SUBSCRIPTION_TTL_MS + 20]);

  const subscribing = transport.subscribe(
    { params: ["newHeads"], onData: () => undefined },
    { retry: false, timeoutMs: 10 },
  );
  const outcome = subscribing.catch((error: unknown) => error);
  await vi.advanceTimersByTimeAsync(LATE_SUBSCRIPTION_TTL_MS + 20);
  expect(await outcome).toBeInstanceOf(RpcTimeoutError);

  expect(unsubscribed()).toEqual([]);
  transport.close();
});
