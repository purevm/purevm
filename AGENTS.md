# Code Conventions

## TypeScript

- Enable `exactOptionalPropertyTypes`. Optional props that can be `undefined` say so: `foo?: string | undefined`.
- Write code as if `noUncheckedIndexedAccess` were on. Narrow indexed reads before use.
- Use `type` over `interface` for your own shapes, and `readonly T[]` for array types in definitions.
- No enums. Use union types or `as const` objects.
- Use `const` generics to preserve literal types.
- Avoid new `as any` where a safer assertion works, and don't let `any` leak into public types.
- Don't extract a named type until it's used in more than one place or it makes a hard shape easier to read.

## Testing

- Use Vitest for unit and integration tests.
- Colocate tests in a `__tests__/` directory next to the source code under test.
- Name unit tests `*.test.ts`. A unit test must not access real external dependencies. Use deterministic fakes for HTTP, WebSocket, timers, and other I/O boundaries.
- Name integration tests `*.integ.ts`. An integration test accesses a real RPC or another real external service. Document its required environment variables, startup steps, command ordering, and other infrastructure requirements, including why each one is necessary.
- Configure Vitest projects to collect `*.test.ts` as unit tests and `*.integ.ts` as integration tests.
- Run `pnpm test` and `pnpm validate` before considering a change complete.
