import { expect, test } from "vitest";

import { createLimiter } from "../limiter.js";

test("never runs more tasks than the concurrency and keeps call order", async () => {
  const limit = createLimiter(2);
  let active = 0;
  let maxActive = 0;
  const started: number[] = [];

  await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      limit(async () => {
        started.push(index);
        active += 1;
        maxActive = Math.max(maxActive, active);
        await Promise.resolve();
        active -= 1;
      }),
    ),
  );

  expect(maxActive).toBe(2);
  expect(started).toEqual([0, 1, 2, 3, 4, 5]);
});

test("releases its slot when a task fails", async () => {
  const limit = createLimiter(1);

  await expect(limit(async () => Promise.reject(new Error("failed")))).rejects.toThrow("failed");
  await expect(limit(async () => "next")).resolves.toBe("next");
});
