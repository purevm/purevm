import { expect, expectTypeOf, test } from "vitest";

import type { RpcTransaction } from "../../actions/eth/types.js";
import { createWebSocketClient } from "../websocket-client.js";
import { FakeWebSocket } from "./fake-websocket.js";

test("exposes shared calls and typed subscription actions", async () => {
  const socket = new FakeWebSocket();
  const values: unknown[] = [];
  const client = createWebSocketClient({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
    retry: false,
  });

  await client.ethBlockNumber();
  const logs = await client.ethSubscribeLogs({
    filter: { address: "0x1234" },
    onData: (log) => values.push(log),
  });
  const heads = await client.ethSubscribeNewHeads({ onData: (head) => values.push(head) });
  const pending = await client.ethSubscribeNewPendingTransactions({
    fullTransactions: true,
    onData: (transaction) => values.push(transaction),
  });
  const syncing = await client.ethSubscribeSyncing({ onData: (status) => values.push(status) });

  socket.receive({
    jsonrpc: "2.0",
    method: "eth_subscription",
    params: { subscription: logs.id, result: { address: "0x1234" } },
  });

  expect(values).toEqual([{ address: "0x1234" }]);
  expect(socket.sent.map(({ method, params }) => ({ method, params }))).toEqual([
    { method: "eth_blockNumber", params: undefined },
    { method: "eth_subscribe", params: ["logs", { address: "0x1234" }] },
    { method: "eth_subscribe", params: ["newHeads"] },
    { method: "eth_subscribe", params: ["newPendingTransactions", true] },
    { method: "eth_subscribe", params: ["syncing"] },
  ]);

  await Promise.all([
    logs.unsubscribe(),
    heads.unsubscribe(),
    pending.unsubscribe(),
    syncing.unsubscribe(),
  ]);
  client.close();
});

test("keeps HTTP-only methods off the WebSocket client", () => {
  const client = createWebSocketClient({
    url: "ws://rpc.example.com",
    createWebSocket: () => new FakeWebSocket(),
  });

  expectTypeOf(client).not.toHaveProperty("debugTraceBlockByHash");
  expectTypeOf(client).not.toHaveProperty("debugTraceTransaction");
  expectTypeOf(client).not.toHaveProperty("traceFilter");
  expectTypeOf(client).not.toHaveProperty("traceTransaction");
  expectTypeOf<Parameters<typeof client.ethSubscribeNewPendingTransactions<true>>[0]["onData"]>()
    .parameter(0)
    .toEqualTypeOf<RpcTransaction>();
  client.close();
});

test("connects explicitly and omits optional subscription parameters", async () => {
  const socket = new FakeWebSocket();
  const client = createWebSocketClient({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
  });

  expect(client.connected).toBe(false);
  await client.connect();
  expect(client.connected).toBe(true);
  const logs = await client.ethSubscribeLogs({ onData: () => undefined });
  const pending = await client.ethSubscribeNewPendingTransactions({
    onData: () => undefined,
  });

  expect(socket.sent.map((request) => request.params)).toEqual([
    ["logs"],
    ["newPendingTransactions"],
  ]);
  await logs.unsubscribe();
  await pending.unsubscribe();
  client.close();
});
