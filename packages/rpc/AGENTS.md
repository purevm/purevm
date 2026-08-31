# Agent Guidelines

## Scope

- Public implementation lives under `src/`.
- `src/types/` is authoritative for request and response shapes. Do not create duplicate catalogs.
- Keep HTTP-only `debug_*` and `trace_*` methods off `WebSocketClient`.
- Keep `eth_subscribe` and subscription helpers off `HttpClient`.
- Keep the published package free of runtime dependencies.

## Structure

- Put reusable RPC actions in `src/actions/`.
- Put client bindings in `src/clients/`.
- Keep files focused by domain. Split files before they become difficult to scan.
- Export public APIs from the nearest `index.ts`, then from `src/index.ts`.
- Use `.js` extensions in TypeScript relative imports.

## Documentation

- Do not use em dashes.
- Use Title Case headings.
- Include complete imports in examples.
- Document protocol availability when adding a method.

## Testing

- Unit tests live in a colocated `__tests__/` folder and use `.test.ts`.
- Integration tests are colocated and use `.integration.test.ts`.
- E2E tests live in `tests/e2e/` and use `.spec.ts` with Playwright.
- Use Vitest for unit and integration tests. Do not use `node:test`.
- Use `src/clients/__tests__/http-client.test.ts` as the canonical client test.
- Test the exact JSON-RPC method and parameter tuple for every action.
- Test protocol separation and generic return inference at compile time.

## Validation

Run `pnpm validate`, `pnpm test:coverage`, and `pnpm pack:check` before completion.
