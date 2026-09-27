# purevm

Monorepo for the `@purevm` npm scope.

## Packages

| Package                                       | Path                  | Description                                                     |
| --------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| [`@purevm/public`](./packages/public)         | `packages/public`     | Read-only public actions for EVM chains over HTTP and WebSocket |
| [`@purevm/transports`](./packages/transports) | `packages/transports` | Small JSON-RPC transports for HTTP and WebSocket                |

Install packages independently:

```bash
pnpm add @purevm/public
```

`@purevm/wallet` will live in `packages/wallet` when it is added.

## Development

```bash
pnpm install
pnpm --filter @purevm/transports validate
pnpm --filter @purevm/public validate
```

Formatting and linting are configured once at the root (`.oxfmtrc.json`, `.oxlintrc.json`) and run
across every package. Everything else is package-scoped: each package owns its own dependencies,
`engines`, `tsdown.config.ts`, and `vitest.config.ts`.
