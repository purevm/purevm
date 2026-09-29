# FetchBlocks

`fetchBlocks` retrieves complete execution data for an inclusive block range without receipts. It
combines full blocks, committed logs, and Parity-style execution traces into one strictly validated,
ordered result, and derives each transaction's status from its traces.

It fetches logs and traces per range instead of per block, so fast chains cost far fewer requests
than `eth_getBlockReceipts` plus `debug_traceBlockByNumber` for every block: about `N + 2` requests
for `N` blocks instead of `3N`. Pick the range size from the block time, for example
`ceil(2000 / blockTimeMs)` blocks to query about every two seconds.

## RPC Strategy

For a range from `fromBlock` to `toBlock`, the module runs these sources concurrently:

- `eth_getLogs` requests covering the range;
- paginated `trace_filter` requests covering the range;
- one `eth_getBlockByNumber(number, true)` call per block.

At most `concurrency` requests run at once, split ranges included. The first request that fails
for good aborts every other one and its error is rethrown unchanged, so an invalid API key costs a
handful of requests and surfaces as the provider's own error.

The block response is canonical. Every log and trace must match its block hash and number. Every
transaction-level log and trace must also match the transaction hash and index from that block.
Inconsistent data rejects the complete operation so snapshots from different reorg branches are
never combined.

## Usage

```ts
import { createHttpClient } from "@purevm/rpc-public";

import { fetchBlocks } from "./modules/fetchBlocks/index.js";

const url = process.env["ETH_HTTP_URL"];
if (!url) throw new Error("ETH_HTTP_URL is required");

const client = createHttpClient({ url });
const result = await fetchBlocks(client, {
  concurrency: 5,
  fromBlock: 20_000_000n,
  maxLogsPerRequest: 10_000,
  toBlock: 20_000_009n,
  tracePageSize: 10_000,
});

for (const block of result.blocks) {
  for (const transaction of block.transactions) {
    process.stdout.write(
      `${block.blockNumber}:${transaction.transactionIndex}:${transaction.status}:${transaction.logs.length}\n`,
    );
  }
}
```

## Ordering

- `blocks` is ascending by requested block number.
- `block.transactions` follows ascending transaction index.
- `transaction.logs` follows ascending global log index.
- `transaction.traces` follows call-tree preorder by `traceAddress`.
- reward traces are stored separately in `block.rewards`.

Transactions without logs receive `logs: []`. A transaction without a trace is rejected because the
result would not represent complete execution data.

## Transaction Status

Each transaction carries `status` and `error`, derived from its top-level trace: `reverted` with the
trace error (for example `Reverted` or `Out of gas`) when the top-level call failed, `success` with
`error: null` otherwise. This is the receipt status without fetching receipts.

## Trace Completeness

Every transaction's traces must form a complete call tree: a root, a parent for each trace, and
exactly `subtraces` children numbered from zero under each trace. A missing or extra trace rejects
the operation, which catches providers that silently cap `trace_filter` results.

## Provider Limits

`eth_getLogs` has no standard pagination parameters. The module first requests the complete range.
It divides the range in half and fetches both halves recursively when the provider rejects it as too
large (a timeout, HTTP 413, code `-32005`, or a range or result limit message) or when the response
reaches `maxLogsPerRequest`. A single block that still fails is rejected with the provider error as
`cause`. Rate limits, authentication, and network failures are never split.

`trace_filter` uses `count: tracePageSize` and increments `after` until the provider returns an
empty page. A short page is not trusted as the last one, because providers may cap `count` without
saying so. A provider that ignores `after` is detected and rejected. Ranges rejected as too large
are divided like log ranges.

Set `maxLogsPerRequest` and `tracePageSize` to limits supported by the selected provider. A provider
that silently truncates logs below the configured limit cannot be detected from the JSON-RPC
response.

Defaults:

| Option              | Default |
| ------------------- | ------: |
| `concurrency`       |     `5` |
| `maxLogsPerRequest` | `10000` |
| `tracePageSize`     | `10000` |

## Commands

```bash
pnpm vitest run --config modules/fetchBlocks/vitest.config.mts
pnpm vitest run --config modules/fetchBlocks/vitest.config.mts --coverage
pnpm tsc --noEmit -p modules/fetchBlocks/tsconfig.json
```
