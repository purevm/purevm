# purevm

Monorepo for the `@purevm` npm scope.

## Packages

| Package                                             | Path                     | Description                                                      |
| --------------------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| [`@purevm/rpc-public`](./packages/rpc-public)       | `packages/rpc-public`    | Read-only public actions for EVM chains over HTTP and WebSocket |
| [`@purevm/rpc-transport`](./packages/rpc-transport) | `packages/rpc-transport` | Small JSON-RPC transports for HTTP and WebSocket                |

Install packages independently:

```bash
pnpm add @purevm/rpc-public
```

`@purevm/wallet` will live in `packages/wallet` when it is added.

## Development

```bash
pnpm install
pnpm --filter @purevm/rpc-transport validate
pnpm --filter @purevm/rpc-public validate
```

Formatting and linting are configured once at the root (`.oxfmtrc.json`, `.oxlintrc.json`) and run
across every package. Everything else is package-scoped: each package owns its own dependencies,
`engines`, `tsdown.config.ts`, and `vitest.config.ts`.

## Versioning

Every package is versioned independently with [Changesets](https://github.com/changesets/changesets).

1. With each change that affects a published package, run `pnpm changeset`, pick the packages and
   the bump type (`patch`, `minor`, or `major`), and commit the generated `.changeset/*.md` file.
2. `pnpm version-packages` consumes the pending changesets: it bumps versions, writes each
   package's `CHANGELOG.md`, updates internal dependency ranges, and refreshes the lockfile.
3. `pnpm release` builds every package and publishes the versions missing from npm, in dependency
   order. It runs from CI so npm provenance can be attached.

Internal dependencies use regular semver ranges such as `"@purevm/rpc-transport": "^0.2.0"`, never
`workspace:*`. `linkWorkspacePackages` in `pnpm-workspace.yaml` still links the local package
whenever its version satisfies the range, and Changesets rewrites the range on every bump, so the
published manifests are exactly what was tested.
