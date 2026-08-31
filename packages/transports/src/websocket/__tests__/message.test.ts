import { expect, test } from "vitest";

import { RpcResponseError, WebSocketProtocolError } from "../../errors/index.js";
import { parseWebSocketMessage } from "../message.js";

test("parses response and subscription messages", () => {
  expect(parseWebSocketMessage('{"id":1,"jsonrpc":"2.0","result":"0x1"}')).toEqual({
    id: 1,
    response: { id: 1, jsonrpc: "2.0", result: "0x1" },
    type: "response",
  });
  expect(
    parseWebSocketMessage(
      '{"jsonrpc":"2.0","method":"eth_subscription","params":{"subscription":"0x1","result":null}}',
    ),
  ).toEqual({ id: "0x1", result: null, type: "subscription" });
});

test("parses ArrayBuffer and typed-array messages", () => {
  const bytes = new TextEncoder().encode('{"id":1,"jsonrpc":"2.0","result":true}');

  expect(parseWebSocketMessage(bytes.buffer)).toMatchObject({ id: 1, type: "response" });
  expect(parseWebSocketMessage(bytes.subarray())).toMatchObject({ id: 1, type: "response" });
});

test.each([
  ["unsupported data", { value: true }],
  ["invalid JSON", "{"],
  ["invalid envelope", "{}"],
  [
    "malformed subscription",
    JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_subscription",
      params: { subscription: 1, result: true },
    }),
  ],
])("rejects %s", (_name, data) => {
  expect(() => parseWebSocketMessage(data)).toThrow(WebSocketProtocolError);
  expect(() => parseWebSocketMessage(data)).toThrow(RpcResponseError);
});

test("preserves the raw invalid message", () => {
  expect(() => parseWebSocketMessage("{")).toThrowError(
    expect.objectContaining({ code: "WEBSOCKET_PROTOCOL", raw: "{" }),
  );
});
