import { expect, expectTypeOf, test } from "vitest";

import type { RpcTransaction } from "../../actions/eth/types.js";
import { createHttpClient } from "../http-client.js";

const hash = `0x${"1".repeat(64)}` as const;
const address = `0x${"2".repeat(40)}` as const;

test("maps every HTTP action to its JSON-RPC request", async () => {
  const requests: { method: string; params?: unknown }[] = [];
  const client = createHttpClient({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as {
        id: number;
        method: string;
        params?: unknown;
      };
      requests.push({ method: request.method, params: request.params });
      return Response.json({ id: request.id, jsonrpc: "2.0", result: resultFor(request.method) });
    },
  });

  await client.ethBlockNumber();
  await client.ethChainId();
  await client.ethGetBalance({ address });
  await client.ethGetBlockByHash({ blockHash: hash });
  await client.ethGetBlockByNumber({ blockNumber: "latest", includeTransactions: true });
  await client.ethGetBlockReceiptsByHash(hash);
  await client.ethGetBlockReceiptsByNumber("safe");
  await client.ethGetCode({ address, block: "0x10" });
  await client.ethGetCode({ address });
  await client.ethGetLogsByHash({ blockHash: hash });
  await client.ethGetLogsByRange({ fromBlock: "0x1", toBlock: "latest" });
  await client.ethGetTransactionByHash(hash);
  await client.ethGetTransactionReceipt(hash);
  await client.netVersion();
  await client.debugTraceBlockByHash(hash);
  await client.debugTraceBlockByNumber("finalized", { tracer: "callTracer", timeout: "5s" });
  await client.traceBlockByHash(hash);
  await client.traceBlockByNumber("earliest");
  await client.traceFilter({ count: 10, fromAddress: [address], fromBlock: "0x1" });

  expect(requests).toEqual([
    { method: "eth_blockNumber" },
    { method: "eth_chainId" },
    { method: "eth_getBalance", params: [address, "latest"] },
    { method: "eth_getBlockByHash", params: [hash, false] },
    { method: "eth_getBlockByNumber", params: ["latest", true] },
    { method: "eth_getBlockReceipts", params: [hash] },
    { method: "eth_getBlockReceipts", params: ["safe"] },
    { method: "eth_getCode", params: [address, "0x10"] },
    { method: "eth_getCode", params: [address, "latest"] },
    { method: "eth_getLogs", params: [{ blockHash: hash }] },
    { method: "eth_getLogs", params: [{ fromBlock: "0x1", toBlock: "latest" }] },
    { method: "eth_getTransactionByHash", params: [hash] },
    { method: "eth_getTransactionReceipt", params: [hash] },
    { method: "net_version" },
    { method: "debug_traceBlockByHash", params: [hash, { tracer: "callTracer" }] },
    {
      method: "debug_traceBlockByNumber",
      params: ["finalized", { timeout: "5s", tracer: "callTracer" }],
    },
    { method: "trace_block", params: [hash] },
    { method: "trace_block", params: ["earliest"] },
    {
      method: "trace_filter",
      params: [{ count: 10, fromAddress: [address], fromBlock: "0x1" }],
    },
  ]);
});

test("infers block transaction shape from includeTransactions", () => {
  const client = createHttpClient({ url: "https://rpc.example.com" });
  const hashes = client.ethGetBlockByNumber({ blockNumber: "latest" });
  const transactions = client.ethGetBlockByHash({ blockHash: hash, includeTransactions: true });

  expectTypeOf(hashes).resolves.toMatchTypeOf<{ transactions: `0x${string}`[] } | null>();
  expectTypeOf(transactions).resolves.toMatchTypeOf<{ transactions: RpcTransaction[] } | null>();
  expectTypeOf(client).not.toHaveProperty("ethSubscribeNewHeads");
});

function resultFor(method: string): unknown {
  if (method === "eth_blockNumber" || method === "eth_chainId" || method === "eth_getBalance") {
    return "0x1";
  }
  if (method === "eth_getCode") return "0x";
  if (method === "net_version") return "1";
  if (method.includes("Logs") || method.startsWith("debug_") || method.startsWith("trace_")) {
    return [];
  }
  return null;
}
