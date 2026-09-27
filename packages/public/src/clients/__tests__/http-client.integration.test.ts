import { createServer } from "node:http";

import { afterAll, beforeAll, expect, test } from "vitest";

import { createHttpClient } from "../http-client.js";

let closeServer: (() => Promise<void>) | undefined;
let url = "";

beforeAll(async () => {
  const server = createServer((request, response) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      body += chunk;
    });
    request.on("end", () => {
      const rpc = JSON.parse(body) as { id: number; method: string };
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ id: rpc.id, jsonrpc: "2.0", result: "0x1" }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP server address.");
  url = `http://127.0.0.1:${address.port}`;
  closeServer = () =>
    new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

afterAll(async () => closeServer?.());

test("calls a real local JSON-RPC HTTP server", async () => {
  const client = createHttpClient({ url, retry: false });

  await expect(client.ethChainId()).resolves.toBe("0x1");
});
