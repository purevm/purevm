# RPC extensions

Small data-fetching helpers built on `@purevm/public`'s `HttpClient`. They normalize common block data
into records keyed by lowercase transaction hash while preserving the RPC package's field types.

## Functions

- `getBlockByHash`, `getBlockByNumber`, `getBlockByTag`: fetch a full block and split its metadata
  from `transactions`.
- `getBlockReceiptsByHash`, `getBlockReceiptsByNumber`, `getBlockReceiptsByTag`: fetch and map all
  receipts by transaction hash.
- `getBlockDebugTracesByHash`, `getBlockDebugTracesByNumber`, `getBlockDebugTracesByTag`: flatten
  Geth `callTracer` trees into the common trace schema.
- `getBlockParityTracesByHash`, `getBlockParityTracesByNumber`, `getBlockParityTracesByTag`: map
  Parity-style block traces into the same schema.
- `getBlocksTraces`: fetch a flexible `trace_filter` range and group traces by block number, then
  transaction hash.

Only HTTP clients are accepted because `debug_*` and `trace_*` are HTTP-only in `@purevm/public`.

## Example

```ts
import { createHttpClient } from "@purevm/public";

import { getBlockByTag, getBlockDebugTracesByTag } from "./extensions/index.js";

const client = createHttpClient({ url: "https://ethereum-rpc.publicnode.com" });

const { block, transactions } = await getBlockByTag(client, "latest");
const { traces } = await getBlockDebugTracesByTag(client, "latest");
```

All transaction keys are validated as 32-byte hashes and normalized to lowercase. Duplicate hashes,
missing blocks or receipts, inconsistent block hashes, and invalid trace block numbers throw
`ExtensionDataError`.

## Normalized trace contract

Normalized traces never contain `undefined` or an empty string for common nullable fields.

| Field    | Exact contract                                                    |
| -------- | ----------------------------------------------------------------- |
| `error`  | `string` when execution failed; otherwise `null`                  |
| `to`     | `Address` when available; otherwise `null`                        |
| `input`  | RPC hex data; an empty byte sequence is exactly `"0x"`            |
| `output` | RPC hex data; missing or empty output is exactly `"0x"`           |
| `value`  | RPC hex quantity; an omitted debug-trace value is exactly `"0x0"` |
| `path`   | Always an array; the root trace is exactly `[]`                   |

Trace variants are discriminated by `type`. Call and creation traces contain `from`, `to`, `value`,
`input`, and `output`. Destruction traces contain `from`, `to`, and `value`. Reward traces contain
`to`, `value`, and `rewardType`.

Block, transaction, and receipt fields preserve the exact `@purevm/public` types. Consequently,
provider-level optional fields remain optional, pending block fields may be `null`, byte data may be
`"0x"`, and quantities use forms such as `"0x0"`. The inspection scripts below reveal the actual
shape returned by a selected provider and block.

## Inspect provider responses

Each command calls every selector variant in its category and prints:

- `result`: the exact returned data. Any runtime `undefined` is represented as
  `{ "$exact": "undefined" }`, because regular JSON would remove it.
- `shape`: a compact recursive view of objects, arrays, transaction-hash records, hex values,
  `null`, `undefined`, `""`, `"0x"`, and `"0x0"`.
- `error`: the exact error name and message when a provider does not support a method.

```bash
pnpm inspect:extensions:block
pnpm inspect:extensions:receipts
pnpm inspect:extensions:debug
pnpm inspect:extensions:parity
pnpm inspect:extensions:range
```

Configuration:

| Environment variable | Default                               | Purpose                                                 |
| -------------------- | ------------------------------------- | ------------------------------------------------------- |
| `PUREVM_RPC_URL`     | `https://ethereum-rpc.publicnode.com` | HTTP JSON-RPC endpoint                                  |
| `PUREVM_BLOCK_TAG`   | `latest`                              | `earliest`, `finalized`, `latest`, `pending`, or `safe` |
| `PUREVM_TIMEOUT_MS`  | `30000`                               | Timeout for each RPC call                               |

The scripts are observations, not tests. Different clients and historical forks can legitimately
return different optional fields.
