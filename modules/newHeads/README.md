# New Heads

Tracks only the latest Ethereum block number and hash using `@purevm/rpc`.

The module subscribes to `newHeads` over WebSocket. If the subscription becomes stale, closes,
returns an older head, fails a heartbeat, or reports an error, HTTP latest-block polling starts and
continues while the module reconnects. Historical blocks are never fetched.

## Usage

```ts
import { NewHeads } from "./modules/newHeads/index.js";

const heads = new NewHeads({
  http: {
    url: "https://ethereum-rpc.publicnode.com",
  },
  websocket: {
    url: "wss://ethereum-rpc.publicnode.com",
  },
  heartbeat: {
    intervalMs: 10_000,
    method: "eth_blockNumber",
    timeoutMs: 5_000,
  },
  polling: {
    delayBeforeStartMs: 15_000,
    fetchIntervalMs: 1_000,
  },
  reconnect: {
    delay: (attempt) => attempt * 5_000,
    minDelayMs: 5_000,
    maxDelayMs: 15_000,
  },
  onHead(event) {
    console.log("head", event.head.number, event.head.hash, event.source);
  },
  onReorg(event) {
    console.log("reorg", event.previous.hash, event.head.hash, event.head.number);
  },
  onError(error) {
    console.error(error);
  },
  onLog(message) {
    console.log(message);
  },
});

await heads.start();

// Later:
await heads.stop();
```

Only `start()` and `stop()` are public instance methods. Both are async and idempotent. `stop()`
clears heartbeat, stale, polling, and reconnect timers, unsubscribes, and closes the WebSocket.

## Events

`onHead` runs only for a newer block number. `onReorg` runs only when the current block number is
received with a different hash. Identical heads are deduplicated and older block numbers are
ignored as events.

Each event contains a source of `http` or `websocket`. Each `BlockHead` contains only:

- `number`: bigint block number
- `numberHex`: original JSON-RPC quantity
- `hash`: normalized lowercase block hash

## Recovery

The heartbeat calls either `eth_blockNumber` or `net_version` over WebSocket without changing the
latest stored head. A heartbeat failure immediately starts HTTP polling and reconnect recovery.

`polling.delayBeforeStartMs` is the maximum time to wait for a current WebSocket head before the
connection is considered stale. Once fallback starts, only
`eth_getBlockByNumber("latest", false)` is requested every `fetchIntervalMs`.

The reconnect delay function receives a one-based attempt number. Its result is clamped between
`minDelayMs` and `maxDelayMs`. The example waits 5 seconds, then 10 seconds, then the maximum 15
seconds for every later attempt. Attempts reset only after a valid current WebSocket head arrives.
HTTP polling continues during every retry.

## Test

```bash
pnpm test:new-heads
pnpm test:new-heads:coverage
pnpm typecheck:new-heads
```
