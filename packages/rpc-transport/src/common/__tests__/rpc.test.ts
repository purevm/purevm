import { expect, test } from "vitest";

import {
  RpcIdMismatchError,
  RpcInvalidResponseError,
  RpcResponseError,
} from "../../errors/index.js";
import { parseRpcResponse } from "../rpc.js";

test("returns a JSON-RPC result", () => {
  expect(parseRpcResponse({ id: 1, jsonrpc: "2.0", result: null }, 1)).toBeNull();
});

test("preserves provider error details", () => {
  expect(() =>
    parseRpcResponse(
      { id: 1, jsonrpc: "2.0", error: { code: -32601, data: { method: "x" }, message: "Missing" } },
      1,
    ),
  ).toThrowError(
    expect.objectContaining({
      code: "RPC_PROVIDER",
      rpcCode: -32601,
      rpcData: { method: "x" },
      rpcMessage: "Missing",
      rpcName: "MethodNotFoundRpcError",
      retryable: false,
    }),
  );
});

test.each([
  ["non-object", null],
  ["wrong version", { id: 1, jsonrpc: "1.0", result: true }],
  ["invalid id", { id: 1.5, jsonrpc: "2.0", result: true }],
  ["mismatched id", { id: 2, jsonrpc: "2.0", result: true }],
  ["missing result and error", { id: 1, jsonrpc: "2.0" }],
  ["result and error", { id: 1, jsonrpc: "2.0", result: true, error: {} }],
  ["invalid error", { id: 1, jsonrpc: "2.0", error: { code: "bad", message: 1 } }],
])("rejects %s responses", (_name, response) => {
  expect(() => parseRpcResponse(response, 1)).toThrow(RpcResponseError);
});

test("preserves mismatched response ids", () => {
  expect(() => parseRpcResponse({ id: 2, jsonrpc: "2.0", result: true }, 1)).toThrowError(
    expect.objectContaining({
      code: "RPC_ID_MISMATCH",
      expectedId: 1,
      responseId: 2,
    }),
  );
  expect(() => parseRpcResponse({ id: 2, jsonrpc: "2.0", result: true }, 1)).toThrow(
    RpcIdMismatchError,
  );
});

test("uses the dedicated invalid response error", () => {
  expect(() => parseRpcResponse({ id: 1, jsonrpc: "2.0" }, 1)).toThrow(RpcInvalidResponseError);
});

test("marks transient provider codes retryable", () => {
  expect(() =>
    parseRpcResponse({ id: 1, jsonrpc: "2.0", error: { code: -32005, message: "Limit" } }, 1),
  ).toThrowError(expect.objectContaining({ retryable: true }));
});

test("marks Viem unknown provider code retryable", () => {
  expect(() =>
    parseRpcResponse({ id: 1, jsonrpc: "2.0", error: { code: -1, message: "Unknown" } }, 1),
  ).toThrowError(expect.objectContaining({ rpcName: "UnknownRpcError", retryable: true }));
});
