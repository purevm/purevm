import { expect, expectTypeOf, test } from "vitest";

import type { RpcTransaction } from "../../actions/eth/types.js";
import * as actions from "../../actions/index.js";
import { createHttpClient, type HttpClient } from "../http-client.js";

const hash = `0x${"1".repeat(64)}` as const;
const address = `0x${"2".repeat(40)}` as const;
const call = { data: "0x", from: address, to: address } as const;
const traceTypes = ["trace"] as const;
const calls = [[call, traceTypes]] as const;
const payload = { blockStateCalls: [{ calls: [call] }] } as const;
const byHash = { blockHash: hash };
const canonical = { blockHash: hash, requireCanonical: true };
const callTracer = { tracer: "callTracer" };

type Case = readonly [
  action: keyof HttpClient,
  invoke: (client: HttpClient) => Promise<unknown>,
  method: string,
  params?: readonly unknown[],
];

const cases: readonly Case[] = [
  // eth: chain and fee market
  ["ethBlobBaseFee", (c) => c.ethBlobBaseFee(), "eth_blobBaseFee"],
  ["ethBlockNumber", (c) => c.ethBlockNumber(), "eth_blockNumber"],
  ["ethChainId", (c) => c.ethChainId(), "eth_chainId"],
  ["ethGasPrice", (c) => c.ethGasPrice(), "eth_gasPrice"],
  ["ethMaxPriorityFeePerGas", (c) => c.ethMaxPriorityFeePerGas(), "eth_maxPriorityFeePerGas"],
  ["ethSyncing", (c) => c.ethSyncing(), "eth_syncing"],
  [
    "ethFeeHistoryByNumber",
    (c) => c.ethFeeHistoryByNumber({ blockCount: "0x5", blockNumber: "0x10" }),
    "eth_feeHistory",
    ["0x5", "0x10", []],
  ],
  [
    "ethFeeHistoryByTag",
    (c) =>
      c.ethFeeHistoryByTag({ blockCount: "0x5", blockTag: "latest", rewardPercentiles: [25, 75] }),
    "eth_feeHistory",
    ["0x5", "latest", [25, 75]],
  ],
  // eth: state
  [
    "ethGetBalanceByNumber",
    (c) => c.ethGetBalanceByNumber({ address, blockNumber: "0x10" }),
    "eth_getBalance",
    [address, "0x10"],
  ],
  [
    "ethGetBalanceByTag",
    (c) => c.ethGetBalanceByTag({ address, blockTag: "latest" }),
    "eth_getBalance",
    [address, "latest"],
  ],
  [
    "ethGetBalanceByHash",
    (c) => c.ethGetBalanceByHash({ address, blockHash: hash }),
    "eth_getBalance",
    [address, byHash],
  ],
  [
    "ethGetCodeByNumber",
    (c) => c.ethGetCodeByNumber({ address, blockNumber: "0x10" }),
    "eth_getCode",
    [address, "0x10"],
  ],
  [
    "ethGetCodeByTag",
    (c) => c.ethGetCodeByTag({ address, blockTag: "safe" }),
    "eth_getCode",
    [address, "safe"],
  ],
  [
    "ethGetCodeByHash",
    (c) => c.ethGetCodeByHash({ address, blockHash: hash, requireCanonical: true }),
    "eth_getCode",
    [address, canonical],
  ],
  [
    "ethGetStorageAtByNumber",
    (c) => c.ethGetStorageAtByNumber({ address, blockNumber: "0x10", position: "0x0" }),
    "eth_getStorageAt",
    [address, "0x0", "0x10"],
  ],
  [
    "ethGetStorageAtByTag",
    (c) => c.ethGetStorageAtByTag({ address, blockTag: "latest", position: "0x0" }),
    "eth_getStorageAt",
    [address, "0x0", "latest"],
  ],
  [
    "ethGetStorageAtByHash",
    (c) => c.ethGetStorageAtByHash({ address, blockHash: hash, position: "0x0" }),
    "eth_getStorageAt",
    [address, "0x0", byHash],
  ],
  [
    "ethGetTransactionCountByNumber",
    (c) => c.ethGetTransactionCountByNumber({ address, blockNumber: "0x10" }),
    "eth_getTransactionCount",
    [address, "0x10"],
  ],
  [
    "ethGetTransactionCountByTag",
    (c) => c.ethGetTransactionCountByTag({ address, blockTag: "pending" }),
    "eth_getTransactionCount",
    [address, "pending"],
  ],
  [
    "ethGetTransactionCountByHash",
    (c) => c.ethGetTransactionCountByHash({ address, blockHash: hash }),
    "eth_getTransactionCount",
    [address, byHash],
  ],
  [
    "ethGetProofByNumber",
    (c) => c.ethGetProofByNumber({ address, blockNumber: "0x10" }),
    "eth_getProof",
    [address, [], "0x10"],
  ],
  [
    "ethGetProofByTag",
    (c) => c.ethGetProofByTag({ address, blockTag: "latest", storageKeys: ["0x0"] }),
    "eth_getProof",
    [address, ["0x0"], "latest"],
  ],
  [
    "ethGetProofByHash",
    (c) => c.ethGetProofByHash({ address, blockHash: hash, storageKeys: ["0x0"] }),
    "eth_getProof",
    [address, ["0x0"], byHash],
  ],
  // eth: execution
  [
    "ethCallByNumber",
    (c) => c.ethCallByNumber({ blockNumber: "0x10", call }),
    "eth_call",
    [call, "0x10"],
  ],
  [
    "ethCallByTag",
    (c) => c.ethCallByTag({ blockTag: "latest", call }),
    "eth_call",
    [call, "latest"],
  ],
  ["ethCallByHash", (c) => c.ethCallByHash({ blockHash: hash, call }), "eth_call", [call, byHash]],
  [
    "ethEstimateGasByNumber",
    (c) => c.ethEstimateGasByNumber({ blockNumber: "0x10", call }),
    "eth_estimateGas",
    [call, "0x10"],
  ],
  [
    "ethEstimateGasByTag",
    (c) => c.ethEstimateGasByTag({ blockTag: "pending", call }),
    "eth_estimateGas",
    [call, "pending"],
  ],
  [
    "ethCreateAccessListByNumber",
    (c) => c.ethCreateAccessListByNumber({ blockNumber: "0x10", call }),
    "eth_createAccessList",
    [call, "0x10"],
  ],
  [
    "ethCreateAccessListByTag",
    (c) => c.ethCreateAccessListByTag({ blockTag: "latest", call }),
    "eth_createAccessList",
    [call, "latest"],
  ],
  [
    "ethSimulateV1ByNumber",
    (c) => c.ethSimulateV1ByNumber({ blockNumber: "0x10", payload }),
    "eth_simulateV1",
    [payload, "0x10"],
  ],
  [
    "ethSimulateV1ByTag",
    (c) => c.ethSimulateV1ByTag({ blockTag: "latest", payload }),
    "eth_simulateV1",
    [payload, "latest"],
  ],
  [
    "ethSimulateV1ByHash",
    (c) => c.ethSimulateV1ByHash({ blockHash: hash, payload }),
    "eth_simulateV1",
    [payload, byHash],
  ],
  // eth: blocks
  [
    "ethGetBlockByHash",
    (c) => c.ethGetBlockByHash({ blockHash: hash }),
    "eth_getBlockByHash",
    [hash, false],
  ],
  [
    "ethGetBlockByNumber",
    (c) => c.ethGetBlockByNumber({ blockNumber: "0x10" }),
    "eth_getBlockByNumber",
    ["0x10", false],
  ],
  [
    "ethGetBlockByTag",
    (c) => c.ethGetBlockByTag({ blockTag: "latest", includeTransactions: true }),
    "eth_getBlockByNumber",
    ["latest", true],
  ],
  [
    "ethGetBlockReceiptsByHash",
    (c) => c.ethGetBlockReceiptsByHash(hash),
    "eth_getBlockReceipts",
    [hash],
  ],
  [
    "ethGetBlockReceiptsByNumber",
    (c) => c.ethGetBlockReceiptsByNumber("0x10"),
    "eth_getBlockReceipts",
    ["0x10"],
  ],
  [
    "ethGetBlockReceiptsByTag",
    (c) => c.ethGetBlockReceiptsByTag("safe"),
    "eth_getBlockReceipts",
    ["safe"],
  ],
  [
    "ethGetBlockTransactionCountByHash",
    (c) => c.ethGetBlockTransactionCountByHash(hash),
    "eth_getBlockTransactionCountByHash",
    [hash],
  ],
  [
    "ethGetBlockTransactionCountByNumber",
    (c) => c.ethGetBlockTransactionCountByNumber("0x10"),
    "eth_getBlockTransactionCountByNumber",
    ["0x10"],
  ],
  [
    "ethGetBlockTransactionCountByTag",
    (c) => c.ethGetBlockTransactionCountByTag("safe"),
    "eth_getBlockTransactionCountByNumber",
    ["safe"],
  ],
  [
    "ethGetUncleByBlockHashAndIndex",
    (c) => c.ethGetUncleByBlockHashAndIndex(hash, "0x0"),
    "eth_getUncleByBlockHashAndIndex",
    [hash, "0x0"],
  ],
  [
    "ethGetUncleByBlockNumberAndIndex",
    (c) => c.ethGetUncleByBlockNumberAndIndex("0x10", "0x0"),
    "eth_getUncleByBlockNumberAndIndex",
    ["0x10", "0x0"],
  ],
  [
    "ethGetUncleByBlockTagAndIndex",
    (c) => c.ethGetUncleByBlockTagAndIndex("latest", "0x0"),
    "eth_getUncleByBlockNumberAndIndex",
    ["latest", "0x0"],
  ],
  [
    "ethGetUncleCountByBlockHash",
    (c) => c.ethGetUncleCountByBlockHash(hash),
    "eth_getUncleCountByBlockHash",
    [hash],
  ],
  [
    "ethGetUncleCountByBlockNumber",
    (c) => c.ethGetUncleCountByBlockNumber("0x10"),
    "eth_getUncleCountByBlockNumber",
    ["0x10"],
  ],
  [
    "ethGetUncleCountByBlockTag",
    (c) => c.ethGetUncleCountByBlockTag("latest"),
    "eth_getUncleCountByBlockNumber",
    ["latest"],
  ],
  // eth: transactions and receipts
  [
    "ethGetTransactionByBlockHashAndIndex",
    (c) => c.ethGetTransactionByBlockHashAndIndex(hash, "0x0"),
    "eth_getTransactionByBlockHashAndIndex",
    [hash, "0x0"],
  ],
  [
    "ethGetTransactionByBlockNumberAndIndex",
    (c) => c.ethGetTransactionByBlockNumberAndIndex("0x10", "0x0"),
    "eth_getTransactionByBlockNumberAndIndex",
    ["0x10", "0x0"],
  ],
  [
    "ethGetTransactionByBlockTagAndIndex",
    (c) => c.ethGetTransactionByBlockTagAndIndex("latest", "0x0"),
    "eth_getTransactionByBlockNumberAndIndex",
    ["latest", "0x0"],
  ],
  [
    "ethGetTransactionByHash",
    (c) => c.ethGetTransactionByHash(hash),
    "eth_getTransactionByHash",
    [hash],
  ],
  [
    "ethGetTransactionReceipt",
    (c) => c.ethGetTransactionReceipt(hash),
    "eth_getTransactionReceipt",
    [hash],
  ],
  // eth: logs and filters
  [
    "ethGetLogsByHash",
    (c) => c.ethGetLogsByHash({ blockHash: hash }),
    "eth_getLogs",
    [{ blockHash: hash }],
  ],
  [
    "ethGetLogsByRange",
    (c) => c.ethGetLogsByRange({ fromBlock: "0x1", toBlock: "latest" }),
    "eth_getLogs",
    [{ fromBlock: "0x1", toBlock: "latest" }],
  ],
  ["ethNewBlockFilter", (c) => c.ethNewBlockFilter(), "eth_newBlockFilter"],
  ["ethNewFilter", (c) => c.ethNewFilter({ address }), "eth_newFilter", [{ address }]],
  [
    "ethNewPendingTransactionFilter",
    (c) => c.ethNewPendingTransactionFilter(),
    "eth_newPendingTransactionFilter",
  ],
  [
    "ethGetFilterChanges",
    (c) => c.ethGetFilterChanges<`0x${string}`>("0x1"),
    "eth_getFilterChanges",
    ["0x1"],
  ],
  ["ethGetFilterLogs", (c) => c.ethGetFilterLogs("0x1"), "eth_getFilterLogs", ["0x1"]],
  ["ethUninstallFilter", (c) => c.ethUninstallFilter("0x1"), "eth_uninstallFilter", ["0x1"]],
  // net and web3
  ["netListening", (c) => c.netListening(), "net_listening"],
  ["netPeerCount", (c) => c.netPeerCount(), "net_peerCount"],
  ["netVersion", (c) => c.netVersion(), "net_version"],
  ["web3ClientVersion", (c) => c.web3ClientVersion(), "web3_clientVersion"],
  ["web3Sha3", (c) => c.web3Sha3("0x68656c6c6f"), "web3_sha3", ["0x68656c6c6f"]],
  // txpool
  ["txpoolContent", (c) => c.txpoolContent(), "txpool_content"],
  ["txpoolContentFrom", (c) => c.txpoolContentFrom(address), "txpool_contentFrom", [address]],
  ["txpoolInspect", (c) => c.txpoolInspect(), "txpool_inspect"],
  ["txpoolStatus", (c) => c.txpoolStatus(), "txpool_status"],
  // debug
  ["debugGetBadBlocks", (c) => c.debugGetBadBlocks(), "debug_getBadBlocks"],
  ["debugGetRawBlockByHash", (c) => c.debugGetRawBlockByHash(hash), "debug_getRawBlock", [hash]],
  [
    "debugGetRawBlockByNumber",
    (c) => c.debugGetRawBlockByNumber("0x10"),
    "debug_getRawBlock",
    ["0x10"],
  ],
  [
    "debugGetRawBlockByTag",
    (c) => c.debugGetRawBlockByTag("latest"),
    "debug_getRawBlock",
    ["latest"],
  ],
  ["debugGetRawHeaderByHash", (c) => c.debugGetRawHeaderByHash(hash), "debug_getRawHeader", [hash]],
  [
    "debugGetRawHeaderByNumber",
    (c) => c.debugGetRawHeaderByNumber("0x10"),
    "debug_getRawHeader",
    ["0x10"],
  ],
  [
    "debugGetRawHeaderByTag",
    (c) => c.debugGetRawHeaderByTag("finalized"),
    "debug_getRawHeader",
    ["finalized"],
  ],
  [
    "debugGetRawReceiptsByHash",
    (c) => c.debugGetRawReceiptsByHash(hash),
    "debug_getRawReceipts",
    [hash],
  ],
  [
    "debugGetRawReceiptsByNumber",
    (c) => c.debugGetRawReceiptsByNumber("0x10"),
    "debug_getRawReceipts",
    ["0x10"],
  ],
  [
    "debugGetRawReceiptsByTag",
    (c) => c.debugGetRawReceiptsByTag("safe"),
    "debug_getRawReceipts",
    ["safe"],
  ],
  [
    "debugGetRawTransaction",
    (c) => c.debugGetRawTransaction(hash),
    "debug_getRawTransaction",
    [hash],
  ],
  [
    "debugTraceBlockByHash",
    (c) => c.debugTraceBlockByHash(hash),
    "debug_traceBlockByHash",
    [hash, callTracer],
  ],
  [
    "debugTraceBlockByNumber",
    (c) => c.debugTraceBlockByNumber("0x10"),
    "debug_traceBlockByNumber",
    ["0x10", callTracer],
  ],
  [
    "debugTraceBlockByTag",
    (c) => c.debugTraceBlockByTag("finalized", { timeout: "5s", tracer: "callTracer" }),
    "debug_traceBlockByNumber",
    ["finalized", { timeout: "5s", tracer: "callTracer" }],
  ],
  [
    "debugTraceCallByHash",
    (c) => c.debugTraceCallByHash(call, hash),
    "debug_traceCall",
    [call, hash, callTracer],
  ],
  [
    "debugTraceCallByNumber",
    (c) => c.debugTraceCallByNumber(call, "0x10"),
    "debug_traceCall",
    [call, "0x10", callTracer],
  ],
  [
    "debugTraceCallByTag",
    (c) => c.debugTraceCallByTag(call, "latest"),
    "debug_traceCall",
    [call, "latest", callTracer],
  ],
  [
    "debugTraceTransaction",
    (c) => c.debugTraceTransaction(hash),
    "debug_traceTransaction",
    [hash, callTracer],
  ],
  // trace
  ["traceBlockByHash", (c) => c.traceBlockByHash(hash), "trace_block", [hash]],
  ["traceBlockByNumber", (c) => c.traceBlockByNumber("0x10"), "trace_block", ["0x10"]],
  ["traceBlockByTag", (c) => c.traceBlockByTag("earliest"), "trace_block", ["earliest"]],
  [
    "traceCallByHash",
    (c) => c.traceCallByHash(call, traceTypes, hash),
    "trace_call",
    [call, traceTypes, hash],
  ],
  [
    "traceCallByNumber",
    (c) => c.traceCallByNumber(call, traceTypes, "0x10"),
    "trace_call",
    [call, traceTypes, "0x10"],
  ],
  [
    "traceCallByTag",
    (c) => c.traceCallByTag(call, traceTypes, "latest"),
    "trace_call",
    [call, traceTypes, "latest"],
  ],
  [
    "traceCallManyByHash",
    (c) => c.traceCallManyByHash(calls, hash),
    "trace_callMany",
    [calls, hash],
  ],
  [
    "traceCallManyByNumber",
    (c) => c.traceCallManyByNumber(calls, "0x10"),
    "trace_callMany",
    [calls, "0x10"],
  ],
  [
    "traceCallManyByTag",
    (c) => c.traceCallManyByTag(calls, "latest"),
    "trace_callMany",
    [calls, "latest"],
  ],
  [
    "traceFilter",
    (c) => c.traceFilter({ count: 10, fromAddress: [address], fromBlock: "0x1" }),
    "trace_filter",
    [{ count: 10, fromAddress: [address], fromBlock: "0x1" }],
  ],
  ["traceGet", (c) => c.traceGet(hash, ["0x0"]), "trace_get", [hash, ["0x0"]]],
  [
    "traceReplayBlockTransactionsByHash",
    (c) => c.traceReplayBlockTransactionsByHash(hash, traceTypes),
    "trace_replayBlockTransactions",
    [hash, traceTypes],
  ],
  [
    "traceReplayBlockTransactionsByNumber",
    (c) => c.traceReplayBlockTransactionsByNumber("0x10", traceTypes),
    "trace_replayBlockTransactions",
    ["0x10", traceTypes],
  ],
  [
    "traceReplayBlockTransactionsByTag",
    (c) => c.traceReplayBlockTransactionsByTag("latest", traceTypes),
    "trace_replayBlockTransactions",
    ["latest", traceTypes],
  ],
  [
    "traceReplayTransaction",
    (c) => c.traceReplayTransaction(hash, traceTypes),
    "trace_replayTransaction",
    [hash, traceTypes],
  ],
  ["traceTransaction", (c) => c.traceTransaction(hash), "trace_transaction", [hash]],
];

test.for(cases)("%s sends the exact JSON-RPC request", async ([, invoke, method, params]) => {
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
      return Response.json({ id: request.id, jsonrpc: "2.0", result: null });
    },
  });

  await invoke(client);

  expect(requests).toEqual([params === undefined ? { method } : { method, params }]);
});

test("covers every exported action", () => {
  const exported = Object.entries(actions)
    .filter(
      ([name, value]) =>
        typeof value === "function" && /^(eth|net|web3|debug|trace|txpool)/.test(name),
    )
    .map(([name]) => name)
    .toSorted();

  expect(cases.map(([action]) => action).toSorted()).toEqual(exported);
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
