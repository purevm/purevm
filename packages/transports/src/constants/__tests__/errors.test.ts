import { expect, test } from "vitest";

import {
  getHttpErrorDefinition,
  getRpcErrorDefinition,
  isRetryableHttpStatus,
  isRetryableRpcErrorCode,
} from "../index.js";

test("returns known HTTP error metadata", () => {
  expect(getHttpErrorDefinition(429)).toEqual({
    message: "Too Many Requests",
    name: "TooManyRequestsError",
  });
  expect(getHttpErrorDefinition(418)).toBeUndefined();
});

test("classifies retryable HTTP statuses", () => {
  expect(isRetryableHttpStatus(408)).toBe(true);
  expect(isRetryableHttpStatus(524)).toBe(true);
  expect(isRetryableHttpStatus(400)).toBe(false);
});

test("returns Viem-compatible RPC error metadata", () => {
  expect(getRpcErrorDefinition(-32601)).toEqual({
    message: "The method does not exist or is not available.",
    name: "MethodNotFoundRpcError",
  });
  expect(getRpcErrorDefinition(1234)).toBeUndefined();
});

test("classifies retryable RPC codes", () => {
  expect(isRetryableRpcErrorCode(-1)).toBe(true);
  expect(isRetryableRpcErrorCode(-32603)).toBe(true);
  expect(isRetryableRpcErrorCode(-32601)).toBe(false);
});
