# Agent Guidelines

Guidelines for AI agents working on this codebase. Adapt the bracketed
placeholders to your project; keep the structure.

## Friction Logging

- Log friction (tooling, docs, APIs, tests, conventions) as you hit it, via
  [your friction-log tool/process — e.g. an issue template, a `friction.md`,
  a `log-friction` script].
- Check what's already logged before adding a duplicate.
- Log project-specific friction only — not global/system/environment issues
  outside this codebase's control.

## Documentation

Rules for authoring docs/guides under [docs directory].

### Prose

- [State your house style explicitly and unambiguously — e.g. "no em
  dashes; use a colon, comma, or separate sentences instead." Vague style
  guidance ("write clearly") doesn't give an agent anything to check
  against — pick concrete, checkable rules.]

### Headings

- [State your casing rule with the exact exception list, not just "use
  title case." e.g.: capitalize first/last word and all major words; keep
  articles, short conjunctions, and short prepositions lowercase unless
  first or last.]
- Code identifiers inside a heading keep their original casing.

### Links

- Link out to every API/function referenced in prose, on first mention.

### Guide Structure

- Fix a standard section order (e.g. `Overview → Recipes/Steps → Best
Practices → See More`) and don't deviate per-guide.
- Don't repeat setup/prerequisites in every guide — link to a single
  canonical setup doc instead.
- Code examples always show their imports in full. Don't hide boilerplate
  with a "cut" directive — an agent (or reader) copying the example should
  get working code.

## Generating Repetitive/Structured Code

When generating code that follows a repeated shape (API clients, generated
bindings, CRUD handlers, action/command sets, etc.), follow this section.

### Source of Truth

- State explicitly which artifact is authoritative when generating code
  from a spec — e.g. "prefer the actual interface/schema/contract over
  hand-written docs when they disagree."
- **If the source of truth is ambiguous, missing, or contradictory: stop
  and ask.** Do not guess at the intended shape or fill gaps with
  assumptions — a wrong guess baked into generated code is worse than a
  short delay.

### Point to a Canonical Example

- Name one real, up-to-date file in the codebase as the reference example
  for this pattern (e.g. `[path/to/canonical-example.ts]`). An agent
  pattern-matching against real code beats an agent following abstract
  prose rules — keep this pointer current as the codebase evolves.

### Required Documentation Per Generated Unit

Each generated function/module should include:

1. A one-line description of what it does.
2. A worked example with full imports and realistic inputs (not
   `foo`/`bar` placeholders).
3. Parameter and return-value documentation.

### Variant Patterns

If a generated construct has known variants (e.g. sync vs. async, read vs.
write, dry-run vs. execute), name the convention for distinguishing them
(a suffix, a flag, separate exports) and apply it consistently — don't let
each generated unit invent its own scheme.

### Required Structural Elements

List the fixed set of exports/fields every generated unit must have (types,
error type, a composable "call" or "spec" primitive, event/result
extractors, etc.), and **why each one is required** — not just that it's
required. If an element is a template default with no real behavior yet
(e.g. a placeholder error type), say so explicitly and note it's
intentional, not an oversight — don't leave a silent TODO baked into every
generated file with no owner or plan to resolve it.

### Decision-Making

When judgment is needed and the answer isn't in this doc or the source of
truth:

- Spec/contract ambiguity → ask, don't assume.
- Missing details → request the missing artifact rather than fabricating one.
- Uncertain edge-case handling → propose the options and ask which to use.

## Testing

- **Unit tests**: pure logic, no I/O — colocated next to the code under
  test (either as a sibling file or a `__tests__/` folder next to the
  component — pick one convention and apply it everywhere).
- **Integration tests**: real external dependencies (DB, queue, RPC, other
  services), no UI — colocated the same way as unit tests, distinguished
  by filename suffix, not by a separate folder.
- **E2E tests**: exercises the full running system from the outside
  (browser, HTTP, CLI) — not colocated, since it isn't "about" one
  component. Lives in a single top-level test directory with its own
  runner/config.
- File-extension convention: pick one suffix per tier (e.g. `.test.ts` for
  unit/integration, `.spec.ts` for e2e) so the extension alone tells you
  which runner owns a file.
- Point to one real, comprehensive test file as the canonical pattern for
  test structure (naming `describe` blocks, a default/happy-path case,
  named behavior/edge-case tests, error-condition tests) rather than
  re-describing the pattern in prose every time.
- Note any non-obvious test-infrastructure gotchas explicitly, with the
  _why_ (race conditions on startup, required command ordering, env flags
  that must be set) — these are exactly the details an agent can't infer
  from reading the code.

## Naming Conventions

- Generated/derived names should match their source (contract function,
  schema field, etc.) under a fixed casing rule — don't leave casing to
  agent discretion.
- Fix the suffix/prefix convention for variants (e.g. `Sync`, `Async`,
  `V2`) once, in this doc, rather than letting it drift per module.
