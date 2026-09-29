import { expect, test, vi } from "vitest";

import { RpcResponseError, RpcSerializationError } from "../../errors/index.js";
import { WebSocketTransport } from "../transport.js";
import { FakeWebSocket } from "./fake-websocket.js";

type ChainId = {
  method: "eth_chainId";
  params?: undefined;
  result: `0x${string}`;
};

test("preserves WebSocket provider errors", async () => {
  const socket = new FakeWebSocket({
    onSend: (request, current) =>
      queueMicrotask(() =>
        current.reject(request.id, -32601, "Missing", { method: request.method }),
      ),
  });
  const transport = createTransport(socket);

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toEqual(
    expect.objectContaining({
      rpcCode: -32601,
      rpcData: { method: "eth_chainId" },
    }),
  );
  transport.close();
});

test("rejects malformed responses for a pending request", async () => {
  const socket = new FakeWebSocket({
    onSend: (request, current) =>
      queueMicrotask(() => current.receive({ id: request.id, jsonrpc: "1.0", result: "0x1" })),
  });
  const transport = createTransport(socket);

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toBeInstanceOf(
    RpcResponseError,
  );
  transport.close();
});

test("reports malformed unsolicited messages", async () => {
  const errors: Error[] = [];
  const socket = new FakeWebSocket();
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
    onError: (error) => errors.push(error),
  });
  await transport.connect();

  socket.receiveData("not-json");

  expect(errors).toHaveLength(1);
  expect(errors[0]).toBeInstanceOf(RpcResponseError);
  transport.close();
});

test("times out an unanswered request", async () => {
  const socket = new FakeWebSocket({ onSend: () => undefined });
  const transport = createTransport(socket, { timeoutMs: 100 });

  const request = transport.request<ChainId>({ method: "eth_chainId" }).catch((e: unknown) => e);
  await vi.advanceTimersByTimeAsync(99);
  expect(socket.sent).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(1);

  expect(await request).toEqual(expect.objectContaining({ timeoutMs: 100 }));
  transport.close();
});

test("aborts a pending request", async () => {
  const socket = new FakeWebSocket({ onSend: () => undefined });
  const transport = createTransport(socket);
  const controller = new AbortController();
  const request = transport.request<ChainId>(
    { method: "eth_chainId" },
    { signal: controller.signal },
  );
  await vi.advanceTimersByTimeAsync(0);
  expect(socket.sent).toHaveLength(1);
  controller.abort("stop");

  await expect(request).rejects.toEqual(expect.objectContaining({ cause: "stop" }));
  transport.close();
});

test("wraps serialization failures", async () => {
  const socket = new FakeWebSocket();
  const transport = createTransport(socket);

  await expect(
    transport.request({ method: "eth_test", params: [1n] } as never),
  ).rejects.toBeInstanceOf(RpcSerializationError);
  expect(socket.sent).toHaveLength(0);
  transport.close();
});

test("wraps send failures", async () => {
  const cause = new Error("send failed");
  const socket = new FakeWebSocket();
  socket.throwOnSend = cause;
  const transport = createTransport(socket);

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toEqual(
    expect.objectContaining({ cause }),
  );
  transport.close();
});

test("retries failed connection attempts", async () => {
  let attempts = 0;
  const transport = new WebSocketTransport({
    url: "ws://rpc.example.com",
    retry: { delayMs: 100, retries: 1 },
    createWebSocket: () => {
      attempts += 1;
      if (attempts === 1) throw new Error("connection failed");
      return new FakeWebSocket();
    },
  });

  const request = transport.request<ChainId>({ method: "eth_chainId" });
  await vi.advanceTimersByTimeAsync(99);
  expect(attempts).toBe(1);
  await vi.advanceTimersByTimeAsync(1);

  await expect(request).resolves.toBe("0x1");
  expect(attempts).toBe(2);
  transport.close();
});

function createTransport(
  socket: FakeWebSocket,
  options: { timeoutMs?: number } = {},
): WebSocketTransport {
  return new WebSocketTransport({
    url: "ws://rpc.example.com",
    createWebSocket: () => socket,
    retry: false,
    ...options,
  });
}
