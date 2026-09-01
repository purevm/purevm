# @purevm/rpc

Typed Ethereum JSON-RPC clients and actions for HTTP and WebSocket. The published package bundles
its transport implementation and has no runtime dependencies.

## Install

```bash
pnpm add @purevm/rpc
```

The package is ESM-only and requires Node.js 22.18 or newer.

## HTTP Client

```ts
import { createHttpClient } from "@purevm/rpc";

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
transaction hashes. `ByNumber` methods accept hexadecimal block numbers. `ByTag` methods accept
`earliest`, `finalized`, `latest`, `pending`, or `safe`.

### HTTP Methods

| Client Method                            | JSON-RPC Method                           |
| ---------------------------------------- | ----------------------------------------- |
| `ethBlobBaseFee`                         | `eth_blobBaseFee`                         |
| `ethBlockNumber`                         | `eth_blockNumber`                         |
| `ethCall`                                | `eth_call`                                |
| `ethChainId`                             | `eth_chainId`                             |
| `ethCreateAccessList`                    | `eth_createAccessList`                    |
| `ethEstimateGas`                         | `eth_estimateGas`                         |
| `ethFeeHistory`                          | `eth_feeHistory`                          |
| `ethGasPrice`                            | `eth_gasPrice`                            |
| `ethGetBalance`                          | `eth_getBalance`                          |
| `ethGetBlockByHash`                      | `eth_getBlockByHash`                      |
| `ethGetBlockByNumber`                    | `eth_getBlockByNumber`                    |
| `ethGetBlockByTag`                       | `eth_getBlockByNumber`                    |
| `ethGetBlockReceiptsByHash`              | `eth_getBlockReceipts`                    |
| `ethGetBlockReceiptsByNumber`            | `eth_getBlockReceipts`                    |
| `ethGetBlockReceiptsByTag`               | `eth_getBlockReceipts`                    |
| `ethGetBlockTransactionCountByHash`      | `eth_getBlockTransactionCountByHash`      |
| `ethGetBlockTransactionCountByNumber`    | `eth_getBlockTransactionCountByNumber`    |
| `ethGetBlockTransactionCountByTag`       | `eth_getBlockTransactionCountByNumber`    |
| `ethGetCode`                             | `eth_getCode`                             |
| `ethGetFilterChanges`                    | `eth_getFilterChanges`                    |
| `ethGetFilterLogs`                       | `eth_getFilterLogs`                       |
| `ethGetLogsByHash`                       | `eth_getLogs`                             |
| `ethGetLogsByRange`                      | `eth_getLogs`                             |
| `ethGetProof`                            | `eth_getProof`                            |
| `ethGetStorageAt`                        | `eth_getStorageAt`                        |
| `ethGetTransactionByBlockHashAndIndex`   | `eth_getTransactionByBlockHashAndIndex`   |
| `ethGetTransactionByBlockNumberAndIndex` | `eth_getTransactionByBlockNumberAndIndex` |
| `ethGetTransactionByBlockTagAndIndex`    | `eth_getTransactionByBlockNumberAndIndex` |
| `ethGetTransactionByHash`                | `eth_getTransactionByHash`                |
| `ethGetTransactionCount`                 | `eth_getTransactionCount`                 |
| `ethGetTransactionReceipt`               | `eth_getTransactionReceipt`               |
| `ethGetUncleByBlockHashAndIndex`         | `eth_getUncleByBlockHashAndIndex`         |
| `ethGetUncleByBlockNumberAndIndex`       | `eth_getUncleByBlockNumberAndIndex`       |
| `ethGetUncleByBlockTagAndIndex`          | `eth_getUncleByBlockNumberAndIndex`       |
| `ethGetUncleCountByBlockHash`            | `eth_getUncleCountByBlockHash`            |
| `ethGetUncleCountByBlockNumber`          | `eth_getUncleCountByBlockNumber`          |
| `ethGetUncleCountByBlockTag`             | `eth_getUncleCountByBlockNumber`          |
| `ethMaxPriorityFeePerGas`                | `eth_maxPriorityFeePerGas`                |
| `ethNewBlockFilter`                      | `eth_newBlockFilter`                      |
| `ethNewFilter`                           | `eth_newFilter`                           |
| `ethNewPendingTransactionFilter`         | `eth_newPendingTransactionFilter`         |
| `ethSyncing`                             | `eth_syncing`                             |
| `ethUninstallFilter`                     | `eth_uninstallFilter`                     |
| `netListening`                           | `net_listening`                           |
| `netPeerCount`                           | `net_peerCount`                           |
| `netVersion`                             | `net_version`                             |
| `debugTraceBlockByHash`                  | `debug_traceBlockByHash`                  |
| `debugTraceBlockByNumber`                | `debug_traceBlockByNumber`                |
| `debugTraceBlockByTag`                   | `debug_traceBlockByNumber`                |
| `debugTraceCallByNumber`                 | `debug_traceCall`                         |
| `debugTraceCallByTag`                    | `debug_traceCall`                         |
| `debugTraceTransaction`                  | `debug_traceTransaction`                  |
| `traceBlockByHash`                       | `trace_block`                             |
| `traceBlockByNumber`                     | `trace_block`                             |
| `traceBlockByTag`                        | `trace_block`                             |
| `traceCallByNumber`                      | `trace_call`                              |
| `traceCallByTag`                         | `trace_call`                              |
| `traceCallManyByNumber`                  | `trace_callMany`                          |
| `traceCallManyByTag`                     | `trace_callMany`                          |
| `traceFilter`                            | `trace_filter`                            |
| `traceGet`                               | `trace_get`                               |
| `traceReplayBlockTransactionsByNumber`   | `trace_replayBlockTransactions`           |
| `traceReplayBlockTransactionsByTag`      | `trace_replayBlockTransactions`           |
| `traceReplayTransaction`                 | `trace_replayTransaction`                 |
| `traceTransaction`                       | `trace_transaction`                       |

All `debug_*` and `trace_*` methods are intentionally HTTP-only. They are absent from
`WebSocketClient`.

### Excluded Methods

The package intentionally excludes wallet custody and transaction-submission methods, including
`eth_accounts`, `eth_sign`, `eth_signTransaction`, `eth_sendTransaction`, and
`eth_sendRawTransaction`. It also excludes mining/work submission, account management, and debug
methods that mutate node state or write trace data to the node filesystem.

`debug_*` methods follow Geth's call-tracer API. `trace_*` methods follow the Parity/OpenEthereum
trace module and require a compatible node with tracing enabled.

## WebSocket Client

```ts
import { createWebSocketClient } from "@purevm/rpc";

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
import { createHttpClient } from "@purevm/rpc";

const client = createHttpClient({
  url: "https://ethereum-rpc.publicnode.com",
  retry: { retries: 3, delayMs: 100, factor: 2 },
  timeoutMs: 10_000,
});

const balance = await client.ethGetBalance(
  {
    address: "0x0000000000000000000000000000000000000000",
    block: "latest",
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
import { HttpTransport, ethGetBlockByHash } from "@purevm/rpc";

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
pnpm build
pnpm pack:check
```

Unit and integration tests use Vitest. Integration tests use local services and require no public
RPC endpoint.

## License

MIT. See `LICENSE.md`.
