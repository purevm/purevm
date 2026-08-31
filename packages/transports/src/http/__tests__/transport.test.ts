import { expect, test } from "vitest";

import {
  HttpStatusError,
  RpcNetworkError,
  RpcProviderError,
  RpcResponseError,
  RpcSerializationError,
} from "../../errors/index.js";
import { HttpTransport } from "../transport.js";

type ChainId = {
  method: "eth_chainId";
  params?: undefined;
  result: `0x${string}`;
};

test("retries transient status errors", async () => {
  let attempts = 0;
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: { delayMs: 0, retries: 2 },
    fetch: async (_input, init) => {
      attempts += 1;
      if (attempts < 3) return new Response("busy", { status: 503 });
      const request = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({ id: request.id, jsonrpc: "2.0", result: "0x1" });
    },
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).resolves.toBe("0x1");
  expect(attempts).toBe(3);
});

test("preserves provider errors", async () => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({
        id: request.id,
        jsonrpc: "2.0",
        error: { code: -32601, message: "Method not found" },
      });
    },
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toBeInstanceOf(
    RpcProviderError,
  );
});

test("exposes non-JSON status errors", async () => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async () => new Response("gateway down", { status: 502 }),
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toBeInstanceOf(
    HttpStatusError,
  );
});

test("sends JSON-RPC body and merges headers", async () => {
  const transport = new HttpTransport({
    url: "https://user:pass@rpc.example.com/path",
    headers: { "x-scope": "transport", "x-transport": "yes" },
    fetch: async (input, init) => {
      const request = JSON.parse(String(init?.body)) as Record<string, unknown>;
      const headers = new Headers(init?.headers);

      expect(input).toBe("https://rpc.example.com/path");
      expect(request).toEqual({ id: 1, jsonrpc: "2.0", method: "eth_chainId" });
      expect(headers.get("authorization")).toBe("Basic dXNlcjpwYXNz");
      expect(headers.get("content-type")).toBe("application/json");
      expect(headers.get("x-scope")).toBe("request");
      expect(headers.get("x-transport")).toBe("yes");

      return Response.json({ id: request["id"], jsonrpc: "2.0", result: "0x1" });
    },
  });

  await expect(
    transport.request<ChainId>({ method: "eth_chainId" }, { headers: { "x-scope": "request" } }),
  ).resolves.toBe("0x1");
});

test("does not retry non-transient HTTP status errors", async () => {
  let attempts = 0;
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: { delayMs: 0, retries: 2 },
    fetch: async () => {
      attempts += 1;
      return new Response("bad request", { status: 400, statusText: "Bad Request" });
    },
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toEqual(
    expect.objectContaining({
      body: "bad request",
      code: "HTTP_STATUS",
      retryable: false,
      status: 400,
      statusName: "BadRequestError",
    }),
  );
  expect(attempts).toBe(1);
});

test("preserves provider errors returned with an HTTP error status", async () => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as { id: number };
      return Response.json(
        { id: request.id, jsonrpc: "2.0", error: { code: -32601, message: "Missing" } },
        { status: 500 },
      );
    },
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toBeInstanceOf(
    RpcProviderError,
  );
});

test.each([
  ["invalid JSON", "not-json"],
  ["invalid envelope", JSON.stringify({ jsonrpc: "2.0", result: "0x1" })],
  ["mismatched id", JSON.stringify({ id: 999, jsonrpc: "2.0", result: "0x1" })],
])("rejects %s responses", async (_name, body) => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async () => new Response(body),
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toBeInstanceOf(
    RpcResponseError,
  );
});

test("retries network failures", async () => {
  let attempts = 0;
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: { delayMs: 0, retries: 1 },
    fetch: async (_input, init) => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("fetch failed");
      const request = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({ id: request.id, jsonrpc: "2.0", result: "0x1" });
    },
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).resolves.toBe("0x1");
  expect(attempts).toBe(2);
});

test("wraps exhausted network failures", async () => {
  const cause = new TypeError("fetch failed");
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async () => {
      throw cause;
    },
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toEqual(
    expect.objectContaining({ cause, code: "RPC_NETWORK", retryable: true }),
  );
});

test("wraps response stream failures as network errors", async () => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async () =>
      ({
        text: async () => {
          throw new Error("stream failed");
        },
      }) as unknown as Response,
  });

  await expect(transport.request<ChainId>({ method: "eth_chainId" })).rejects.toBeInstanceOf(
    RpcNetworkError,
  );
});

test("wraps request serialization failures", async () => {
  const transport = new HttpTransport({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async () => {
      throw new Error("fetch must not run");
    },
  });

  const call = { method: "eth_test", params: [1n] } as never;
  await expect(transport.request(call)).rejects.toBeInstanceOf(RpcSerializationError);
});
