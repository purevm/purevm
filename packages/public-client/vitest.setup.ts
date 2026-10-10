import { afterEach, beforeEach, vi } from "vitest";

// Unit tests never depend on wall-clock time or real I/O: timers are faked and advanced
// explicitly, and the platform network APIs fail loudly unless a test injects a fake.
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", () => {
    throw new Error("Unit tests must inject a fake fetch.");
  });
  vi.stubGlobal("WebSocket", function WebSocket() {
    throw new Error("Unit tests must inject a fake WebSocket factory.");
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
