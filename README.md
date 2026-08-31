# purevm

Monorepo for the `@purevm` npm scope.

## Packages

| Package                         | Path           | Description                                              |
| ------------------------------- | -------------- | -------------------------------------------------------- |
| [`@purevm/rpc`](./packages/rpc) | `packages/rpc` | HTTP and WebSocket RPC toolkit for EVM-compatible chains |

Install packages independently:

```bash
pnpm add @purevm/rpc
```

`@purevm/wallet` will live in `packages/wallet` when it is added.

## Development

```bash
pnpm install
pnpm build
pnpm test
```
