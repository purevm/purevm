import { expect, test, vi } from "vitest";

import { RpcAbortError, RpcTimeoutError } from "../../errors/index.js";
import { HttpTransport } from "../transport.js";

type ChainId = {
  method: "eth_chainId";
  params?: undefined;
  result: `0x${string}`;
};

function abortingFetch(
  _input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
  });
}

test("returns typed timeout error", async () => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    fetch: abortingFetch,
    retry: false,
    timeoutMs: 100,
  });

  const request = transport.request<ChainId>({ method: "eth_chainId" }).catch((e: unknown) => e);
  await vi.advanceTimersByTimeAsync(100);

  expect(await request).toBeInstanceOf(RpcTimeoutError);
});

test("does not retry caller abort", async () => {
  const controller = new AbortController();
  controller.abort();
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    fetch: abortingFetch,
  });

  await expect(
    transport.request<ChainId>({ method: "eth_chainId" }, { signal: controller.signal }),
  ).rejects.toBeInstanceOf(RpcAbortError);
});

test("retries timeout failures when configured", async () => {
  let attempts = 0;
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: { delayMs: 50, retries: 1 },
    timeoutMs: 100,
    fetch: async (_input, init) => {
      attempts += 1;
      if (attempts === 1) return abortingFetch(_input, init);
      const request = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({ id: request.id, jsonrpc: "2.0", result: "0x1" });
    },
  });

  const request = transport.request<ChainId>({ method: "eth_chainId" });
  await vi.advanceTimersByTimeAsync(149);
  expect(attempts).toBe(1);
  await vi.advanceTimersByTimeAsync(1);

  await expect(request).resolves.toBe("0x1");
  expect(attempts).toBe(2);
});

test("uses request timeout override", async () => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    fetch: abortingFetch,
    retry: false,
    timeoutMs: 1_000,
  });

  const request = transport
    .request<ChainId>({ method: "eth_chainId" }, { timeoutMs: 100 })
    .catch((e: unknown) => e);
  await vi.advanceTimersByTimeAsync(100);

  expect(await request).toEqual(expect.objectContaining({ timeoutMs: 100 }));
});
