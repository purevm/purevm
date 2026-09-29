import { expect, test } from "vitest";

import { DEFAULT_TIMEOUT_MS, resolveTimeout } from "../options.js";
import { createRequestIdGenerator } from "../request-id.js";

test("resolves request, transport, and default timeouts in priority order", () => {
  expect(resolveTimeout({ timeoutMs: 20 }, { timeoutMs: 5 })).toBe(5);
  expect(resolveTimeout({ timeoutMs: 20 }, {})).toBe(20);
  expect(resolveTimeout({}, {})).toBe(DEFAULT_TIMEOUT_MS);
});

test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 31])(
  "rejects invalid timeout %s",
  (timeoutMs) => {
    expect(() => resolveTimeout({ timeoutMs }, {})).toThrow(RangeError);
  },
);

test("generates increasing request ids", () => {
  const nextId = createRequestIdGenerator();

  expect([nextId(), nextId(), nextId()]).toEqual([1, 2, 3]);
});
