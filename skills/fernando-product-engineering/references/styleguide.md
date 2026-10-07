# Code style

## Comments explain what the code cannot

Only add code comments when they explain something non-obvious: a constraint, tradeoff, invariant, workaround, or reason a simpler implementation would be wrong. Prefer clear names and structure to explanatory narration. Do not restate a function name, describe an obvious assignment, label every file's architectural layer, or narrate the edit history. Remove stale comments when behavior changes. Required license/tool directives and useful public API documentation remain appropriate; public documentation should explain semantics the signature cannot convey.

Before:

```ts
// Get the query client.
const queryClient = getQueryClient()

// Return the existing browser client.
return browserClient ??= createConfiguredQueryClient()
```

After:

```ts
const queryClient = getQueryClient()

// Retain the cache if React retries an initially suspended render.
return browserClient ??= createConfiguredQueryClient()
```

File-path annotations in this skill's teaching snippets locate examples; do not mechanically copy them into production file headers.

## Oxlint and Oxfmt

Use **Oxlint** for JavaScript/TypeScript linting and **Oxfmt** as the single formatter. Install them as pinned development dependencies with the repository's package manager and commit the lockfile and configuration. Use the same checked-in configuration in the editor, local scripts, and CI. Ignore generated output, dependencies, and vendored snapshots deliberately; do not churn unrelated files during a narrow change.

Example script conventions:

```json
{
  "scripts": {
    "lint": "oxlint .",
    "format": "oxfmt --write .",
    "format:check": "oxfmt --check ."
  }
}
```

These are adoption examples, not a claim the tools are already installed. Set lint severity and warning policy explicitly for the project. CI runs lint and the non-mutating format check; format writes are a local development action.

Preserve required architecture, type-aware, Query, and React Compiler diagnostics when adopting Oxlint. Audit rule coverage against the installed versions; do not assume similarly named rules or plugin support preserve custom behavior. Keep a narrowly scoped ESLint command for checks that have not been migrated and verified (including the bundled ESLint architecture profile). Run it alongside Oxlint until equivalent coverage is proven, then remove redundant checks. Oxfmt owns formatting; do not run a second formatter or conflicting ESLint formatting rules.

Official references: [Oxlint](https://oxc.rs/docs/guide/usage/linter), [Oxfmt](https://oxc.rs/docs/guide/usage/formatter). See [enforcement](enforcement.md) for this kit's existing architecture gates and [React](react.md#modern-react-and-react-compiler) for compiler diagnostics.
