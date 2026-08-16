---
name: clean-code
description: Use when implementing, refactoring, or reviewing code for readability, local reasoning, and maintainability.
---

# Clean Code

Apply clean-code guidance without broad rewrites or unnecessary abstractions.

## Use when

- Implementing new code.
- Refactoring existing code.
- Reviewing code for readability, naming, structure, or maintainability.

## Rules

- Preserve behavior unless the task explicitly asks to change it.
- Keep the happy path easy to read.
- Split setup, validation, computation, side effects, and cleanup when they are mixed.
- Prefer small functions with one clear responsibility and one abstraction level.
- Use precise names. One concept should have one name.
- Prefer explicit types, objects, or domain names over primitive clusters and boolean flags.
- Separate commands from queries. Do not hide mutation in functions that look like reads.
- Keep framework, vendor, persistence, transport, security, and construction details behind boundaries.
- Prefer simple structure over speculative abstraction.
- Remove duplication only when the repeated concept is clear.
- Use comments only for rationale, constraints, warnings, or external contracts.
- Treat tests as production code: readable, deterministic, and focused on behavior.

## TypeScript bias

- Prefer type-safe boundaries over runtime guessing.
- Avoid clever generic types unless they improve caller safety.
- Keep public APIs hard to misuse.

## File organization comments

Use section separators to make TypeScript files easier to scan.

For regular files, group code in this order when relevant:

```ts
// ============================================================
// Types
// ============================================================

// ============================================================
// Constants
// ============================================================

// ============================================================
// Functions
// ============================================================

// ============================================================
// Classes
// ============================================================

// ============================================================
// Exports
// ============================================================
```

Rules:

- Add separators only when the file is large enough to benefit from scanning structure.
- Do not add empty sections.
- Keep section names simple and consistent.
- Do not use separators to hide a file with too many responsibilities.

## Class-internal section separators

Use class-internal separators only when the class is large enough to benefit from scanning structure.

Prefer this order when relevant:

```ts
export class Example {
    // ===========================
    // Static Properties
    // ===========================

    // ===========================
    // Properties
    // ===========================

    // ===========================
    // Constructor
    // ===========================

    constructor() {}

    // ===========================
    // Static Methods
    // ===========================

    // ===========================
    // Public Methods
    // ===========================

    // ===========================
    // Private Methods
    // ===========================

    // ===========================
    // Protected Methods
    // ===========================
}
```

Rules:

- Do not add empty sections.
- Do not split public/private properties unless the class is large enough to need it.
- Keep the constructor before behavior methods.
- Prefer Properties, Public Methods, and Private Methods over many tiny sections.

## Review behavior

When reviewing code:

1. Identify the biggest readability or maintainability issue first.
2. Explain why it increases change cost.
3. Suggest the smallest safe improvement.
4. Avoid broad rewrites unless the current structure blocks the requested change.

## Refactor behavior

When refactoring:

1. Keep behavior unchanged.
2. Make the smallest useful cleanup.
3. Improve names before adding comments.
4. Extract helpers only when they improve local reasoning.
5. Stop before cleanup spreads into unrelated code.

## Final checklist

- Can the changed code be understood locally?
- Are names carrying intent without comments?
- Is mutation explicit?
- Is the happy path clear?
- Are external details kept behind boundaries?
- Are relevant tests or checks updated/run when possible?