# Agent Guidelines

## Scope

- Public implementation lives under `src/`.
- Keep method-specific and domain response types beside their prefix under `src/actions/`.
- Keep only cross-domain primitives and requester contracts in `src/types/`.
- Keep HTTP-only `debug_*` and `trace_*` methods off `WebSocketClient`.
- Keep `eth_subscribe` and subscription helpers off `HttpClient`.
- Keep `@purevm/transports` as the only runtime dependency.

## Structure

- Sort reusable RPC actions into `src/actions/eth/`, `net/`, `web3/`, `txpool/`, `debug/`, and `trace/`.
- Put client bindings in `src/clients/`.
- Give every exported action its own same-name file.
- Export public APIs from the nearest `index.ts`, then from `src/index.ts`.
- Use `.js` extensions in TypeScript relative imports.

## Documentation

- Do not use em dashes.
- Use Title Case headings.
- Include complete imports in examples.
- Document protocol availability when adding a method.
