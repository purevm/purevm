# @purevm/public

Typed public actions for EVM chains: every read-only JSON-RPC method a node exposes, over HTTP and
WebSocket. Signing and transaction submission belong to `@purevm/wallet`. The only runtime
dependency is `@purevm/transports`, re-exported from this package.

## Install

```bash
pnpm add @purevm/public
```

The package is ESM-only and requires Node.js 22.18 or newer.

## HTTP Client

```ts
import { createHttpClient } from "@purevm/public";

const client = createHttpClient({
  url: "https://ethereum-rpc.publicnode.com",
});

const blockNumber = await client.ethBlockNumber();
const block = await client.ethGetBlockByNumber({
  blockNumber: "0x10",
  includeTransactions: true,
});

if (block) {
  for (const transaction of block.transactions) {
    console.log(transaction.hash);
  }
}
```

`includeTransactions: true` returns `RpcTransaction[]`. Omitting it or passing `false` returns
transaction hashes.

### Calling Convention

Every method that needs input takes a single parameters object, followed by optional request
options. Methods without input take only the request options:

```ts
import { createHttpClient } from "@purevm/public";

const client = createHttpClient({ url: "https://ethereum-rpc.publicnode.com" });

await client.ethChainId();
await client.ethGetTransactionByBlockTagAndIndex({ blockTag: "latest", index: "0x0" });
await client.traceCallByNumber(
  {
    blockNumber: "0x10",
    call: { to: "0x0000000000000000000000000000000000000001" },
    traceTypes: ["trace"],
  },
  { timeoutMs: 5_000 },
);
```

Field names describe the value, not its position: `blockHash`, `blockNumber`, `blockTag`,
`transactionHash`, `index`, `filterId`, `call`, `traceTypes`, and so on.

### Block Selection

A method whose JSON-RPC call targets a block exists once per selector the node API accepts, and its
name says which one it takes:

| Suffix     | Parameter                        | Example value                                        |
| ---------- | -------------------------------- | ---------------------------------------------------- |
| `ByNumber` | `blockNumber`                    | `"0x10"`                                             |
| `ByTag`    | `blockTag`                       | `earliest`, `finalized`, `latest`, `pending`, `safe` |
| `ByHash`   | `blockHash`, `requireCanonical?` | 32-byte block hash                                   |

State and execution methods (`eth_getBalance`, `eth_getCode`, `eth_getStorageAt`,
`eth_getTransactionCount`, `eth_getProof`, `eth_call`, `eth_simulateV1`) send `ByHash` selectors
as EIP-1898 objects, so `requireCanonical: true` rejects a block that left the canonical chain.
`eth_estimateGas`, `eth_createAccessList`, and `eth_feeHistory` only accept numbers and tags in the
Ethereum execution API specification, so they have no `ByHash` variant.

### HTTP Methods

| Client Method                            | JSON-RPC Method                        |
| ---------------------------------------- | -------------------------------------- |
| `ethBlobBaseFee`                         | `eth_blobBaseFee`                      |
| `ethBlockNumber`                         | `eth_blockNumber`                      |
| `ethChainId`                             | `eth_chainId`                          |
| `ethGasPrice`                            | `eth_gasPrice`                         |
| `ethMaxPriorityFeePerGas`                | `eth_maxPriorityFeePerGas`             |
| `ethSyncing`                             | `eth_syncing`                          |
| `ethFeeHistoryByNumber`                  | `eth_feeHistory`                       |
| `ethFeeHistoryByTag`                     | `eth_feeHistory`                       |
| `ethGetBalanceByNumber`                  | `eth_getBalance`                       |
| `ethGetBalanceByTag`                     | `eth_getBalance`                       |
| `ethGetBalanceByHash`                    | `eth_getBalance`                       |
| `ethGetCodeByNumber`                     | `eth_getCode`                          |
| `ethGetCodeByTag`                        | `eth_getCode`                          |
| `ethGetCodeByHash`                       | `eth_getCode`                          |
| `ethGetStorageAtByNumber`                | `eth_getStorageAt`                     |
| `ethGetStorageAtByTag`                   | `eth_getStorageAt`                     |
| `ethGetStorageAtByHash`                  | `eth_getStorageAt`                     |
| `ethGetTransactionCountByNumber`         | `eth_getTransactionCount`              |
| `ethGetTransactionCountByTag`            | `eth_getTransactionCount`              |
| `ethGetTransactionCountByHash`           | `eth_getTransactionCount`              |
| `ethGetProofByNumber`                    | `eth_getProof`                         |
| `ethGetProofByTag`                       | `eth_getProof`                         |
| `ethGetProofByHash`                      | `eth_getProof`                         |
| `ethCallByNumber`                        | `eth_call`                             |
| `ethCallByTag`                           | `eth_call`                             |
| `ethCallByHash`                          | `eth_call`                             |
| `ethEstimateGasByNumber`                 | `eth_estimateGas`                      |
| `ethEstimateGasByTag`                    | `eth_estimateGas`                      |
| `ethCreateAccessListByNumber`            | `eth_createAccessList`                 |
| `ethCreateAccessListByTag`               | `eth_createAccessList`                 |
| `ethSimulateV1ByNumber`                  | `eth_simulateV1`                       |
| `ethSimulateV1ByTag`                     | `eth_simulateV1`                       |
| `ethSimulateV1ByHash`                    | `eth_simulateV1`                       |
| `ethGetBlockByHash`                      | `eth_getBlockByHash`                   |
| `ethGetBlockByNumber`                    | `eth_getBlockByNumber`                 |
| `ethGetBlockByTag`                       | `eth_getBlockByNumber`                 |
| `ethGetBlockReceiptsByHash`              | `eth_getBlockReceipts`                 |
| `ethGetBlockReceiptsByNumber`            | `eth_getBlockReceipts`                 |
| `ethGetBlockReceiptsByTag`               | `eth_getBlockReceipts`                 |
| `ethGetBlockTransactionCountByHash`      | `eth_getBlockTransactionCountByHash`   |
| `ethGetBlockTransactionCountByNumber`    | `eth_getBlockTransactionCountByNumber` |
| `ethGetBlockTransactionCountByTag`       | `eth_getBlockTransactionCountByNumber` |
| `ethGetUncleByBlockHashAndIndex`         | `0x0`                                  |
| `ethGetUncleByBlockNumberAndIndex`       | `0x0`                                  |
| `ethGetUncleByBlockTagAndIndex`          | `0x0`                                  |
| `ethGetUncleCountByBlockHash`            | `eth_getUncleCountByBlockHash`         |
| `ethGetUncleCountByBlockNumber`          | `eth_getUncleCountByBlockNumber`       |
| `ethGetUncleCountByBlockTag`             | `eth_getUncleCountByBlockNumber`       |
| `ethGetTransactionByBlockHashAndIndex`   | `0x0`                                  |
| `ethGetTransactionByBlockNumberAndIndex` | `0x0`                                  |
| `ethGetTransactionByBlockTagAndIndex`    | `0x0`                                  |
| `ethGetTransactionByHash`                | `eth_getTransactionByHash`             |
| `ethGetTransactionReceipt`               | `eth_getTransactionReceipt`            |
| `ethGetLogsByHash`                       | `eth_getLogs`                          |
| `ethGetLogsByRange`                      | `eth_getLogs`                          |
| `ethNewBlockFilter`                      | `eth_newBlockFilter`                   |
| `ethNewFilter`                           | `eth_newFilter`                        |
| `ethNewPendingTransactionFilter`         | `eth_newPendingTransactionFilter`      |
| `ethGetFilterChanges`                    | `eth_getFilterChanges`                 |
| `ethGetFilterLogs`                       | `eth_getFilterLogs`                    |
| `ethUninstallFilter`                     | `eth_uninstallFilter`                  |
| `netListening`                           | `net_listening`                        |
| `netPeerCount`                           | `net_peerCount`                        |
| `netVersion`                             | `net_version`                          |
| `web3ClientVersion`                      | `web3_clientVersion`                   |
| `web3Sha3`                               | `web3_sha3`                            |
| `txpoolContent`                          | `txpool_content`                       |
| `txpoolContentFrom`                      | `txpool_contentFrom`                   |
| `txpoolInspect`                          | `txpool_inspect`                       |
| `txpoolStatus`                           | `txpool_status`                        |
| `debugGetBadBlocks`                      | `debug_getBadBlocks`                   |
| `debugGetRawBlockByHash`                 | `debug_getRawBlock`                    |
| `debugGetRawBlockByNumber`               | `debug_getRawBlock`                    |
| `debugGetRawBlockByTag`                  | `debug_getRawBlock`                    |
| `debugGetRawHeaderByHash`                | `debug_getRawHeader`                   |
| `debugGetRawHeaderByNumber`              | `debug_getRawHeader`                   |
| `debugGetRawHeaderByTag`                 | `debug_getRawHeader`                   |
| `debugGetRawReceiptsByHash`              | `debug_getRawReceipts`                 |
| `debugGetRawReceiptsByNumber`            | `debug_getRawReceipts`                 |
| `debugGetRawReceiptsByTag`               | `debug_getRawReceipts`                 |
| `debugGetRawTransaction`                 | `debug_getRawTransaction`              |
| `debugTraceBlockByHash`                  | `debug_traceBlockByHash`               |
| `debugTraceBlockByNumber`                | `debug_traceBlockByNumber`             |
| `debugTraceBlockByTag`                   | `debug_traceBlockByNumber`             |
| `debugTraceCallByHash`                   | `debug_traceCall`                      |
| `debugTraceCallByNumber`                 | `0x10`                                 |
| `debugTraceCallByTag`                    | `latest`                               |
| `debugTraceTransaction`                  | `debug_traceTransaction`               |
| `traceBlockByHash`                       | `trace_block`                          |
| `traceBlockByNumber`                     | `trace_block`                          |
| `traceBlockByTag`                        | `trace_block`                          |
| `traceCallByHash`                        | `trace_call`                           |
| `traceCallByNumber`                      | `0x10`                                 |
| `traceCallByTag`                         | `latest`                               |
| `traceCallManyByHash`                    | `trace_callMany`                       |
| `traceCallManyByNumber`                  | `0x10`                                 |
| `traceCallManyByTag`                     | `latest`                               |
| `traceFilter`                            | `trace_filter`                         |
| `traceGet`                               | `trace_get`                            |
| `traceReplayBlockTransactionsByHash`     | `trace_replayBlockTransactions`        |
| `traceReplayBlockTransactionsByNumber`   | `trace_replayBlockTransactions`        |
| `traceReplayBlockTransactionsByTag`      | `trace_replayBlockTransactions`        |
| `traceReplayTransaction`                 | `trace_replayTransaction`              |
| `traceTransaction`                       | `trace_transaction`                    |

All `debug_*` and `trace_*` methods are intentionally HTTP-only. They are absent from
`WebSocketClient`.

### Excluded Methods

The package intentionally excludes wallet custody and transaction-submission methods, including
`eth_accounts`, `eth_sign`, `eth_signTransaction`, `eth_sendTransaction`, and
`eth_sendRawTransaction`. It also excludes mining/work submission, account management, and debug
methods that mutate node state or write trace data to the node filesystem.

`debug_getRaw*` and `debug_getBadBlocks` follow the Ethereum execution API specification. The
`debug_trace*` methods follow Geth's tracer API, also implemented by Reth, Erigon, and Nethermind; the set of built-in tracers varies by client. `trace_*` methods follow the Parity/OpenEthereum
trace module and require a compatible node with tracing enabled. `trace_*ByHash` variants need
Erigon, Reth, or Nethermind; historical Parity nodes only accept numbers and tags.

### Chain-Specific Transactions

`RpcTransaction` covers the Ethereum envelopes (`0x0` to `0x4`), OP Stack deposits (`0x7e`, as
`RpcTransactionOpDeposit`), and any other type as `RpcTransactionUnknown`, which keeps every field
the node returns. Narrowing on a known type stays exact:

```ts
import type { RpcTransaction } from "@purevm/public";

function describe(transaction: RpcTransaction): string {
  if (transaction.type === "0x2") return `EIP-1559, max fee ${transaction.maxFeePerGas}`;
  if (transaction.type === "0x7e") return `OP deposit with source ${transaction.sourceHash}`;
  if (String(transaction.type) === "0x6a") return "Arbitrum internal transaction";
  return `type ${transaction.type}`;
}
```

Receipts expose the OP Stack L1 fee fields (`l1Fee`, `l1GasUsed`, `l1BaseFeeScalar`, and more) and
the Arbitrum fields (`gasUsedForL1`, `l1BlockNumber`) as optional properties. Blocks expose the
Arbitrum `l1BlockNumber`, `sendCount`, and `sendRoot`.

### Call Overrides

`ethCallBy*` and `ethEstimateGasBy*` accept `stateOverrides`, keyed by address, to replace an
account's `balance`, `nonce`, `code`, full `state`, or individual `stateDiff` slots before execution.
`ethCallBy*` also accepts `blockOverrides` (`number`, `time`, `gasLimit`, `baseFeePerGas`, and more).
Overrides are only sent when provided, so calls without them stay compatible with every node.

```ts
import { createHttpClient } from "@purevm/public";

const client = createHttpClient({ url: "https://ethereum-rpc.publicnode.com" });
const token = "0x0000000000000000000000000000000000000001";

const result = await client.ethCallByTag({
  blockTag: "latest",
  call: { data: "0x18160ddd", to: token },
  stateOverrides: { [token]: { stateDiff: { "0x2": "0x64" } } },
  blockOverrides: { time: "0x6553f100" },
});
```

State overrides are supported by Geth, Reth, Erigon, Nethermind, and Besu. Block overrides on
`eth_call` are supported by Geth and Reth. `eth_estimateGas` takes no block overrides because not
every client accepts them.

### Transaction Pool

`txpoolStatus`, `txpoolContent`, `txpoolContentFrom`, and `txpoolInspect` read the node's mempool.
They are available on both `HttpClient` and `WebSocketClient`. Content is keyed by sender address,
then by decimal nonce:

```ts
import { createHttpClient } from "@purevm/public";

const client = createHttpClient({ url: "http://localhost:8545" });

const { pending, queued } = await client.txpoolStatus();
const content = await client.txpoolContentFrom({
  address: "0x0000000000000000000000000000000000000001",
});
for (const [nonce, transaction] of Object.entries(content.pending)) {
  console.log(nonce, transaction.hash);
}
```

Geth and Reth implement all four methods; Erigon and Nethermind implement a subset, and Besu
exposes its own `txpool_besu*` methods instead. Most public RPC providers disable this namespace, so
it usually requires your own node.

### Debug Tracers

Every `debug_trace*` method takes an optional tracer configuration in its `config` field. It defaults to `callTracer`, and the result type follows the selected tracer:

| Configuration                                                    | Result                                 |
| ---------------------------------------------------------------- | -------------------------------------- |
| `{ tracer: "callTracer" }` (default)                             | `DebugCallFrame`                       |
| `{ tracer: "flatCallTracer" }`                                   | `TraceEntry[]` (Parity format)         |
| `{ tracer: "prestateTracer" }`                                   | `DebugPrestate`                        |
| `{ tracer: "prestateTracer", tracerConfig: { diffMode: true } }` | `DebugPrestateDiff` (`pre` and `post`) |
| `{ tracer: "4byteTracer" }`                                      | `DebugFourByteResult`                  |
| `{ tracer: "noopTracer" }`                                       | Empty object                           |
| `{ tracer: "muxTracer", tracerConfig: { ... } }`                 | One result per listed tracer           |
| No `tracer` field, for example `{ enableMemory: true }`          | `DebugStructLogResult` (opcode steps)  |
| `{ tracer: "<JavaScript source>" }`                              | `unknown`                              |

Every configuration also accepts `timeout` (a Go duration such as `"5s"`) and `reexec`.
`debug_traceCall` additionally accepts `stateOverrides` and `blockOverrides`.

```ts
import { createHttpClient } from "@purevm/public";

const client = createHttpClient({ url: "https://ethereum-rpc.publicnode.com" });

const diff = await client.debugTraceTransaction({
  transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  config: { tracer: "prestateTracer", tracerConfig: { diffMode: true } },
});
console.log(diff.pre, diff.post);

const traces = await client.debugTraceBlockByTag({
  blockTag: "latest",
  config: {
    tracer: "4byteTracer",
    timeout: "5s",
  },
});
for (const trace of traces) {
  if (trace.result === undefined) console.error(trace.txHash, trace.error);
  else console.log(trace.txHash, trace.result);
}
```

A block trace entry carries `error` instead of `result` when the node could not trace that
transaction, for example after `timeout`.

## WebSocket Client

```ts
import { createWebSocketClient } from "@purevm/public";

const client = createWebSocketClient({
  url: "wss://ethereum-rpc.publicnode.com",
});

const subscription = await client.ethSubscribeNewHeads({
  onData(head) {
    console.log(head.number, head.hash);
  },
  onError(error) {
    console.error(error);
  },
});

await subscription.unsubscribe();
client.close();
```

Only `WebSocketClient` exposes subscription methods:

| Client Method                        | Subscription Type        | Callback Result              |
| ------------------------------------ | ------------------------ | ---------------------------- |
| `ethSubscribeLogs`                   | `logs`                   | `RpcLog`                     |
| `ethSubscribeNewHeads`               | `newHeads`               | `NewHeadsSubscriptionResult` |
| `ethSubscribeNewPendingTransactions` | `newPendingTransactions` | Hash or `RpcTransaction`     |
| `ethSubscribeSyncing`                | `syncing`                | Boolean or syncing state     |

Active subscriptions are restored after a connection closes. Failed restoration is retried using
the transport retry policy. A subscription's `onError` receives failed restoration errors, and the
transport-level `onError` receives errors after retries are exhausted.

## Request Options

Every regular client method accepts request options as its final argument. HTTP methods additionally
accept per-request headers.

```ts
import { createHttpClient } from "@purevm/public";

const client = createHttpClient({
  url: "https://ethereum-rpc.publicnode.com",
  retry: { retries: 3, delayMs: 100, factor: 2 },
  timeoutMs: 10_000,
});

const balance = await client.ethGetBalanceByTag(
  {
    address: "0x0000000000000000000000000000000000000000",
    blockTag: "latest",
  },
  {
    headers: { "x-request-id": "balance-check" },
    timeoutMs: 5_000,
  },
);
```

## Standalone Actions

Actions are exported separately for composition with any structurally compatible typed requester.

```ts
import { HttpTransport, ethGetBlockByHash } from "@purevm/public";

const transport = new HttpTransport({
  url: "https://ethereum-rpc.publicnode.com",
});

const block = await ethGetBlockByHash(transport, {
  blockHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
});
```

## Errors

All transport errors, constants, and retry helpers from `@purevm/transports` are re-exported. See
`TransportError`, `RpcProviderError`, `RpcTimeoutError`, and `isRetryableError` for typed handling.

## Development

```bash
pnpm check
pnpm test
pnpm test:coverage
pnpm test:integ
pnpm build
pnpm pack:check
```

`pnpm test` runs the unit tests (`src/**/__tests__/*.test.ts`). They use fake timers and fake
`fetch` and WebSocket implementations, so they never touch the network.

`pnpm test:integ` runs the integration tests (`src/**/__tests__/*.integ.ts`) against a real node.
They need `BASE_HTTP_URL`, a Base mainnet endpoint with the `trace_*` and `debug_*` namespaces
enabled, read from the monorepo root `.env` or the environment. The header of
`src/clients/__tests__/http-client.integ.ts` documents every requirement.

`scripts/newHeadsAvailability.ts` measures how quickly `newHeads` notifications become readable
over HTTP. It needs `BASE_HTTP_URL` and `BASE_WS_URL`: run it with `pnpm tsx scripts/newHeadsAvailability.ts`.

## License

MIT. See `LICENSE.md`.
