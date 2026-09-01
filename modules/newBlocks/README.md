# NewBlocks

`NewBlocks` streams the latest execution block header with WebSocket as the fast path and HTTP as a
recovery path. It retains one header only and emits typed events that explain each accepted chain
transition.

## Usage

```ts
import { NewBlocks } from "./modules/newBlocks/index.js";

const blocks = new NewBlocks({
  http: { url: "https://ethereum-rpc.publicnode.com" },
  websocket: { url: "wss://ethereum-rpc.publicnode.com" },
  heartbeat: {
    intervalMs: 15_000,
    method: "eth_blockNumber",
    timeoutMs: 5_000,
  },
  polling: {
    intervalMs: 2_000,
    staleAfterMs: 24_000,
  },
  reconnect: {
    delay: (attempt) => attempt * 5_000,
    minDelayMs: 5_000,
    maxDelayMs: 30_000,
  },
  onEvent(event) {
    if (event.type === "block") {
      console.log("block", event.block.number, event.block.hash);
    } else if (event.type === "gap") {
      console.log("missing", event.missing.from, event.missing.to);
    } else {
      console.log("reorg", event.kind, event.previous.hash, event.block.hash);
    }
  },
  onError(error) {
    console.error(error);
  },
  onLog(message) {
    console.log(message);
  },
});

await blocks.start();
await blocks.stop();
```

## Events

| Event                          | Meaning                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `block`                        | First accepted header, or the next height whose `parentHash` matches the retained hash.   |
| `gap`                          | A newer header skipped one or more heights. `missing` contains the exact range and count. |
| `reorg` with `replacement`     | The retained height arrived again with a different hash.                                  |
| `reorg` with `parent-mismatch` | The next height does not reference the retained hash.                                     |

Every event includes its `source`, the parsed block header, and the previous header when one exists.
Numbers and timestamps are available as both `bigint` and their original JSON-RPC quantity. Headers
also record `receivedAt` in Unix milliseconds.

Duplicate headers and older heights are logged and ignored. They never move state backward or emit
consumer events.

## Recovery

Startup begins the initial HTTP latest-block request and WebSocket subscription concurrently. This
provides an initial chain baseline without delaying subscription setup.

A subscription error, transport error, socket close, heartbeat failure, malformed WebSocket header,
or stale subscription starts HTTP polling and schedules a reconnect. Polling continues across failed
reconnect attempts. It stops only after the active WebSocket delivers a header that is not older than
the retained HTTP head.

Reconnect delays come from the one-based `reconnect.delay(attempt)` callback and are clamped between
`minDelayMs` and `maxDelayMs`. A valid current WebSocket header resets the attempt counter.

`start()` and `stop()` are async and idempotent. Stopping clears polling and reconnect timers,
unsubscribes, closes the active socket, and discards retained state.

## Commands

```bash
pnpm typecheck:new-blocks
pnpm test:new-blocks
pnpm test:new-blocks:coverage
```
