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
  await client.ethGetBlockByNumber({ blockNumber: "0x10" });
  await client.ethGetBlockByTag({ blockTag: "latest", includeTransactions: true });
  await client.ethGetBlockByTag({ blockTag: "pending" });
  await client.ethGetBlockReceiptsByHash(hash);
  await client.ethGetBlockReceiptsByNumber("0x10");
  await client.ethGetBlockReceiptsByTag("safe");
  await client.ethGetCode({ address, block: "0x10" });
  await client.ethGetCode({ address });
  await client.ethGetLogsByHash({ blockHash: hash });
  await client.ethGetLogsByRange({ fromBlock: "0x1", toBlock: "latest" });
  await client.ethGetTransactionByHash(hash);
  await client.ethGetTransactionReceipt(hash);
  await client.netVersion();
  await client.debugTraceBlockByHash(hash);
  await client.debugTraceBlockByNumber("0x10");
  await client.debugTraceBlockByTag("finalized", { tracer: "callTracer", timeout: "5s" });
  await client.traceBlockByHash(hash);
  await client.traceBlockByNumber("0x10");
  await client.traceBlockByTag("earliest");
  await client.traceFilter({ count: 10, fromAddress: [address], fromBlock: "0x1" });

  expect(requests).toEqual([
    { method: "eth_blockNumber" },
    { method: "eth_chainId" },
    { method: "eth_getBalance", params: [address, "latest"] },
    { method: "eth_getBlockByHash", params: [hash, false] },
    { method: "eth_getBlockByNumber", params: ["0x10", false] },
    { method: "eth_getBlockByNumber", params: ["latest", true] },
    { method: "eth_getBlockByNumber", params: ["pending", false] },
    { method: "eth_getBlockReceipts", params: [hash] },
    { method: "eth_getBlockReceipts", params: ["0x10"] },
    { method: "eth_getBlockReceipts", params: ["safe"] },
    { method: "eth_getCode", params: [address, "0x10"] },
    { method: "eth_getCode", params: [address, "latest"] },
    { method: "eth_getLogs", params: [{ blockHash: hash }] },
    { method: "eth_getLogs", params: [{ fromBlock: "0x1", toBlock: "latest" }] },
    { method: "eth_getTransactionByHash", params: [hash] },
    { method: "eth_getTransactionReceipt", params: [hash] },
    { method: "net_version" },
    { method: "debug_traceBlockByHash", params: [hash, { tracer: "callTracer" }] },
    { method: "debug_traceBlockByNumber", params: ["0x10", { tracer: "callTracer" }] },
    {
      method: "debug_traceBlockByNumber",
      params: ["finalized", { timeout: "5s", tracer: "callTracer" }],
    },
    { method: "trace_block", params: [hash] },
    { method: "trace_block", params: ["0x10"] },
    { method: "trace_block", params: ["earliest"] },
    {
      method: "trace_filter",
      params: [{ count: 10, fromAddress: [address], fromBlock: "0x1" }],
    },
  ]);
});

test("infers block transaction shape from includeTransactions", () => {
  const client = createHttpClient({ url: "https://rpc.example.com" });
  const hashes = client.ethGetBlockByNumber({ blockNumber: "0x10" });
  const transactions = client.ethGetBlockByTag({
    blockTag: "latest",
    includeTransactions: true,
  });

  expectTypeOf(hashes).resolves.toMatchTypeOf<{ transactions: `0x${string}`[] } | null>();
  expectTypeOf(transactions).resolves.toMatchTypeOf<{ transactions: RpcTransaction[] } | null>();
  expectTypeOf(client).not.toHaveProperty("ethSubscribeNewHeads");
});

test("maps every additional basic action to its JSON-RPC request", async () => {
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
  const call = { data: "0x", from: address, to: address } as const;
  const traceTypes = ["trace"] as const;
  const calls = [[call, traceTypes]] as const;

  await client.ethBlobBaseFee();
  await client.ethCall({ call });
  await client.ethCreateAccessList({ block: "0x10", call });
  await client.ethEstimateGas({ call });
  await client.ethFeeHistory({ blockCount: "0x5", newestBlock: "latest" });
  await client.ethGasPrice();
  await client.ethGetBlockTransactionCountByHash(hash);
  await client.ethGetBlockTransactionCountByNumber("0x10");
  await client.ethGetBlockTransactionCountByTag("safe");
  await client.ethGetFilterChanges<`0x${string}`>("0x1");
  await client.ethGetFilterLogs("0x1");
  await client.ethGetProof({ address, storageKeys: ["0x0"] });
  await client.ethGetStorageAt({ address, position: "0x0" });
  await client.ethGetTransactionByBlockHashAndIndex(hash, "0x0");
  await client.ethGetTransactionByBlockNumberAndIndex("0x10", "0x0");
  await client.ethGetTransactionByBlockTagAndIndex("latest", "0x0");
  await client.ethGetTransactionCount({ address });
  await client.ethGetUncleByBlockHashAndIndex(hash, "0x0");
  await client.ethGetUncleByBlockNumberAndIndex("0x10", "0x0");
  await client.ethGetUncleByBlockTagAndIndex("latest", "0x0");
  await client.ethGetUncleCountByBlockHash(hash);
  await client.ethGetUncleCountByBlockNumber("0x10");
  await client.ethGetUncleCountByBlockTag("latest");
  await client.ethMaxPriorityFeePerGas();
  await client.ethNewBlockFilter();
  await client.ethNewFilter({ address });
  await client.ethNewPendingTransactionFilter();
  await client.ethSyncing();
  await client.ethUninstallFilter("0x1");
  await client.netListening();
  await client.netPeerCount();
  await client.debugTraceCallByNumber(call, "0x10");
  await client.debugTraceCallByTag(call, "latest");
  await client.debugTraceTransaction(hash);
  await client.traceCallByNumber(call, traceTypes, "0x10");
  await client.traceCallByTag(call, traceTypes, "latest");
  await client.traceCallManyByNumber(calls, "0x10");
  await client.traceCallManyByTag(calls, "latest");
  await client.traceGet(hash, ["0x0"]);
  await client.traceReplayBlockTransactionsByNumber("0x10", traceTypes);
  await client.traceReplayBlockTransactionsByTag("latest", traceTypes);
  await client.traceReplayTransaction(hash, traceTypes);
  await client.traceTransaction(hash);

  expect(requests).toEqual([
    { method: "eth_blobBaseFee" },
    { method: "eth_call", params: [call, "latest"] },
    { method: "eth_createAccessList", params: [call, "0x10"] },
    { method: "eth_estimateGas", params: [call, "latest"] },
    { method: "eth_feeHistory", params: ["0x5", "latest", []] },
    { method: "eth_gasPrice" },
    { method: "eth_getBlockTransactionCountByHash", params: [hash] },
    { method: "eth_getBlockTransactionCountByNumber", params: ["0x10"] },
    { method: "eth_getBlockTransactionCountByNumber", params: ["safe"] },
    { method: "eth_getFilterChanges", params: ["0x1"] },
    { method: "eth_getFilterLogs", params: ["0x1"] },
    { method: "eth_getProof", params: [address, ["0x0"], "latest"] },
    { method: "eth_getStorageAt", params: [address, "0x0", "latest"] },
    { method: "eth_getTransactionByBlockHashAndIndex", params: [hash, "0x0"] },
    { method: "eth_getTransactionByBlockNumberAndIndex", params: ["0x10", "0x0"] },
    { method: "eth_getTransactionByBlockNumberAndIndex", params: ["latest", "0x0"] },
    { method: "eth_getTransactionCount", params: [address, "latest"] },
    { method: "eth_getUncleByBlockHashAndIndex", params: [hash, "0x0"] },
    { method: "eth_getUncleByBlockNumberAndIndex", params: ["0x10", "0x0"] },
    { method: "eth_getUncleByBlockNumberAndIndex", params: ["latest", "0x0"] },
    { method: "eth_getUncleCountByBlockHash", params: [hash] },
    { method: "eth_getUncleCountByBlockNumber", params: ["0x10"] },
    { method: "eth_getUncleCountByBlockNumber", params: ["latest"] },
    { method: "eth_maxPriorityFeePerGas" },
    { method: "eth_newBlockFilter" },
    { method: "eth_newFilter", params: [{ address }] },
    { method: "eth_newPendingTransactionFilter" },
    { method: "eth_syncing" },
    { method: "eth_uninstallFilter", params: ["0x1"] },
    { method: "net_listening" },
    { method: "net_peerCount" },
    { method: "debug_traceCall", params: [call, "0x10", { tracer: "callTracer" }] },
    { method: "debug_traceCall", params: [call, "latest", { tracer: "callTracer" }] },
    { method: "debug_traceTransaction", params: [hash, { tracer: "callTracer" }] },
    { method: "trace_call", params: [call, traceTypes, "0x10"] },
    { method: "trace_call", params: [call, traceTypes, "latest"] },
    { method: "trace_callMany", params: [calls, "0x10"] },
    { method: "trace_callMany", params: [calls, "latest"] },
    { method: "trace_get", params: [hash, ["0x0"]] },
    { method: "trace_replayBlockTransactions", params: ["0x10", traceTypes] },
    { method: "trace_replayBlockTransactions", params: ["latest", traceTypes] },
    { method: "trace_replayTransaction", params: [hash, traceTypes] },
    { method: "trace_transaction", params: [hash] },
  ]);
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
