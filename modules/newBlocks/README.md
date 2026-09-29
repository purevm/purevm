# NewBlocks

`NewBlocks` follows the latest block header of an EVM chain over WebSocket `newHeads`. It classifies
each header against what it already emitted, reports skipped heights without fetching them, falls
back to HTTP polling when the subscription goes quiet, and reconnects the WebSocket on its own.

## Usage

```ts
import { NewBlocks } from "./modules/newBlocks/index.js";

const blocks = new NewBlocks({
  // The HTTP endpoint may be a different provider than the WebSocket one.
  http: { url: "https://base-rpc.publicnode.com" },
  websocket: { url: "wss://base-rpc.publicnode.com", heartbeat: { intervalMs: 15_000 } },
  polling: {
    // No newer block for 10 s: poll HTTP every 10 s and replace the socket.
    staleAfterMs: 10_000,
  },
  reconnect: {
    delay: (attempt) => attempt * 1_000,
    minDelayMs: 1_000,
    maxDelayMs: 30_000,
  },
  onEvent(event) {
    if (event.type === "block") {
      console.log("block", event.block.number, event.block.hash, event.source);
    } else if (event.type === "reorg") {
      console.log("reorg", event.kind, event.previous.hash, "->", event.block.hash);
    } else {
      console.log("missing", event.missing.from, event.missing.to, event.reason);
    }
  },
  onError(error) {
    console.error(error);
  },
});

await blocks.start();
// ...
await blocks.stop();
```

## Events

Every event carries the parsed `block` header and its `source`: `websocket` or `http` (fallback
poll).

| Event                          | Meaning                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `block`                        | The first header, or the next height whose `parentHash` is the previous header.    |
| `reorg` with `replacement`     | A height already emitted arrived with another hash. `replaced` is the old header.  |
| `reorg` with `parent-mismatch` | The next height does not extend the previous header.                               |
| `gap`                          | The header skipped heights. `missing` gives the exact range; they are not fetched. |

Headers never produce an event when they are:

- **duplicates**: the exact header was already emitted at that height;
- **stale**: older than the last `historySize` emitted heights, so they cannot be compared.

A `replacement` can target a height below the head, for example when the node switches to a shorter
branch. The stream then continues from that height, so the following header is a normal `block`.

Numbers and timestamps are available as `bigint` and as the original JSON-RPC quantity. Headers also
record `receivedAt` in Unix milliseconds.

## Latency

`blockLatency` measures how late a header arrived, from its timestamp and from the previous header:

```ts
import { blockLatency, NewBlocks } from "./modules/newBlocks/index.js";

const blocks = new NewBlocks({
  // ...
  onEvent(event) {
    const previous = event.type === "block" ? event.previous : undefined;
    const { propagationMs, sincePreviousMs } = blockLatency(event.block, previous);
    console.log(event.block.number, `${propagationMs}ms after mint`, sincePreviousMs);
  },
});
```

`propagationMs` compares the local reception time with the block timestamp. Timestamps have
one-second precision and depend on both clocks, so treat it as an approximation.

## Missing Blocks

The stream only tracks the chain head. When a header skips heights, for example after a
reconnection or while polling HTTP slower than the block time, a `gap` event reports them and the
stream continues from the new head. Fetch them yourself when every block matters:

```ts
import { createHttpClient } from "@purevm/rpc-public";
import { toQuantity } from "@purevm/rpc-public/utils";

const client = createHttpClient({ url: "https://base-rpc.publicnode.com" });

function onGap(from: bigint, to: bigint): void {
  for (let number = from; number <= to; number++) {
    void client.ethGetBlockByNumber({ blockNumber: toQuantity(number) });
  }
}
```

## Recovery

- `start()` requests the latest block over HTTP and subscribes over WebSocket concurrently.
- The socket is replaced when it closes, reports a transport or subscription error, sends an
  invalid header, fails the transport heartbeat, or delivers no header at least as high as the
  emitted head for `polling.staleAfterMs`.
- While the socket is being replaced, HTTP polls `latest` every `polling.intervalMs` (default:
  `staleAfterMs`). Polling stops as soon as the new subscription delivers a current header.
- Reconnect delays come from `reconnect.delay(attempt)`, clamped between `minDelayMs` and
  `maxDelayMs`. A current WebSocket header resets the attempt counter.
- Liveness of an idle socket is checked by the WebSocket transport heartbeat, configured through
  `websocket.heartbeat`.

`start()` and `stop()` are idempotent. `stop()` clears timers, unsubscribes, closes the socket,
discards state, and guarantees that no event is emitted afterwards.

## Options

| Option        | Default  | Description                                                    |
| ------------- | -------- | -------------------------------------------------------------- |
| `http`        | required | HTTP transport options used for fallback polling.              |
| `websocket`   | required | WebSocket transport options, including `heartbeat`.            |
| `polling`     | required | `staleAfterMs`, and `intervalMs` (defaults to `staleAfterMs`). |
| `reconnect`   | required | `delay(attempt)`, `minDelayMs`, `maxDelayMs`.                  |
| `historySize` | `128`    | Emitted heights remembered to detect duplicates and reorgs.    |
| `onEvent`     | required | Receives `block`, `reorg`, and `gap` events.                   |
| `onError`     | required | Receives recoverable errors.                                   |
| `onLog`       | none     | Receives diagnostic messages.                                  |

## Commands

```bash
pnpm vitest run --config modules/newBlocks/vitest.config.mts
pnpm vitest run --config modules/newBlocks/vitest.config.mts --coverage
pnpm tsc --noEmit -p modules/newBlocks/tsconfig.json
```
