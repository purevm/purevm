import { expect, test } from "vitest";

import { WebSocketConnectionError } from "../../errors/index.js";
import { closeMessage, defaultWebSocketFactory, openWebSocket } from "../socket.js";
import { parseWebSocketUrl } from "../url.js";
import { FakeWebSocket } from "./fake-websocket.js";

test("opens a WebSocket", async () => {
  const socket = new FakeWebSocket();

  await expect(openWebSocket("ws://rpc.example.com", () => socket, 100)).resolves.toBe(socket);
});

test("requests ArrayBuffer binary messages", async () => {
  const socket = Object.assign(new FakeWebSocket(), { binaryType: "blob" });
  await openWebSocket("ws://rpc.example.com", () => socket, 100);

  expect(socket.binaryType).toBe("arraybuffer");
});

test("wraps synchronous factory failures", async () => {
  const cause = new Error("factory failed");

  await expect(
    openWebSocket(
      "ws://rpc.example.com",
      () => {
        throw cause;
      },
      100,
    ),
  ).rejects.toEqual(expect.objectContaining({ cause }));
});

test("wraps connection error and close events", async () => {
  const failed = new FakeWebSocket({ autoOpen: false });
  const failure = openWebSocket("ws://rpc.example.com", () => failed, 100);
  failed.fail("socket error");
  await expect(failure).rejects.toBeInstanceOf(WebSocketConnectionError);

  const closed = new FakeWebSocket({ autoOpen: false });
  const closure = openWebSocket("ws://rpc.example.com", () => closed, 100);
  closed.close(1_006, "gone");
  await expect(closure).rejects.toThrow("WebSocket connection closed (1006): gone.");
});

test("times out an unopened connection", async () => {
  const socket = new FakeWebSocket({ autoOpen: false });

  await expect(openWebSocket("ws://rpc.example.com", () => socket, 1)).rejects.toEqual(
    expect.objectContaining({ timeoutMs: 1 }),
  );
  expect(socket.readyState).toBe(3);
});

test("aborts an unopened connection", async () => {
  const socket = new FakeWebSocket({ autoOpen: false });
  const controller = new AbortController();
  const connection = openWebSocket("ws://rpc.example.com", () => socket, 100, controller.signal);
  controller.abort("stop");

  await expect(connection).rejects.toEqual(expect.objectContaining({ cause: "stop" }));
  expect(socket.readyState).toBe(3);
});

test("reports missing platform WebSocket support", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "WebSocket");
  Object.defineProperty(globalThis, "WebSocket", { configurable: true, value: undefined });
  try {
    expect(() => defaultWebSocketFactory("ws://rpc.example.com")).toThrow(WebSocketConnectionError);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "WebSocket", descriptor);
    else Reflect.deleteProperty(globalThis, "WebSocket");
  }
});

test.each(["http://rpc.example.com", "file:///tmp/rpc", " ws://rpc.example.com"])(
  "rejects invalid WebSocket URL %s",
  (url) => {
    expect(() => parseWebSocketUrl(url)).toThrow(TypeError);
  },
);

test("formats close details", () => {
  expect(closeMessage({})).toBe("WebSocket connection closed.");
  expect(closeMessage({ code: 1_006, reason: "gone" })).toBe(
    "WebSocket connection closed (1006): gone.",
  );
});
