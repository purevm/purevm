import {
  HttpStatusError,
  RpcNetworkError,
  RpcProviderError,
  RpcTimeoutError,
} from "@purevm/rpc-public";
import { expect, test } from "vitest";

import { isRangeTooLargeError } from "../range-errors.js";

const provider = (code: number, message: string) => new RpcProviderError({ code, message });

test.each([
  ["a timeout", new RpcTimeoutError(1_000)],
  ["HTTP 413", new HttpStatusError(413, "Content Too Large", "")],
  ["the limit code", provider(-32005, "query returned more than 10000 results")],
  ["a block range message", provider(-32000, "block range is too large")],
  ["a result count message", provider(-32602, "query exceeds max results 20000")],
  ["a response size message", provider(-32000, "Log response size exceeded.")],
])("splits a range after %s", (_name, error) => {
  expect(isRangeTooLargeError(error)).toBe(true);
});

test.each([
  ["authentication", new HttpStatusError(401, "Unauthorized", "invalid api key")],
  ["an HTTP rate limit", new HttpStatusError(429, "Too Many Requests", "")],
  ["a rate-limit code", provider(-32005, "daily request count exceeded, request rate limited")],
  [
    "a rate-limit message",
    provider(429, "Your app has exceeded its compute units per second capacity"),
  ],
  ["an unrelated provider error", provider(-32601, "the method trace_filter does not exist")],
  ["a network failure", new RpcNetworkError(new Error("ECONNRESET"))],
  ["a plain error", new Error("boom")],
])("does not split a range after %s", (_name, error) => {
  expect(isRangeTooLargeError(error)).toBe(false);
});
