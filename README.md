# Fernando's product engineering kit

Draft 0.6 — Fernando Rojo's product conventions with a focused executable lint profile and SDK/Query acceptance gate. The public references and synthetic fixtures support the guidance; the full product starter remains integration work.

The aim is **a product derived from its API, with feature-local ownership and replaceable implementations**. Write the consumer story first. Own the complexity below it. Build products that can be recomposed, moved to another client, or deleted without excavating infrastructure.

Given the SDK, someone should be able to build the next client: Swift, Next.js, CLI, MCP, or something we have not anticipated. The SDK is one complete, extensible product interface. Packages are designed as if independently publishable; apps consume their public boundaries. Public types have one API-owned runtime definition. Strong type safety, fast tooling/runtime behavior, and enforceable conventions are requirements throughout.

For coding agents and harnesses, the client and execution environment are separate choices: a tool may execute on a local computer or in an injected sandbox. See [runtime composition](skills/fernando-product-engineering/references/runtimes.md).

Start here:

1. [Architecture and decisions](docs/architecture.md): the layer boundaries, proposed folder tree, settled principles, and decisions still open.
2. [Rule-by-rule code recipes](skills/fernando-product-engineering/references/recipes.md): 31 instructions with concrete snippets.
3. [Example book](skills/fernando-product-engineering/references/examples.md): contract-first code from a service through a chat feature to different apps.
4. [The skill](skills/fernando-product-engineering/SKILL.md): the compact entry point another AI should use, with focused references.
5. [Enforcement](skills/fernando-product-engineering/references/enforcement.md): executable adoption profile, architecture acceptance checks, and remaining rule backlog.
6. [Reference evidence](docs/reference-evidence.md): public documentation, synthetic examples, and the limits of their evidence.
7. [Executable contract slice](eval-outputs/contract-slice/README.md): a small verified example of the important behavioral boundaries.
8. [Grok 4.6 skill-following eval](eval-outputs/next-expo-electron-grok46/README.md): a mocked Next / Expo / Electron product used to score whether Grok 4.6 can follow this skill end to end.
9. [Validation notes](docs/validation.md): checks performed, forward-test corrections, and what remains unproven.

## Packaging

One skill directory contains the normative guidance and its references. Copy the entire `skills/fernando-product-engineering` directory into a future repository's supported skill location or personal skill directory. Its references remain relative and portable. This draft is kept in this workspace for review; it has not been installed globally as a production starter.

The single entry point avoids overlapping skills independently deciding architectural policy. References divide the work by concern: boundaries, contracts and backend, client SDK, React, platform integration, examples, instruction recipes, and enforcement. Split into independently installable skills later only if real usage shows a need. No plugin or runtime dependency is required to read this kit.

## Status and limits

- Roots are vanilla; framework integrations use explicit slash exports and optional peers. The SDK exposes one complete root client and one React query surface.
- Schemas are colocated with their core feature; there is no global contracts package. Internal RPC and query helpers derive from the API rather than handwritten method mirrors.
- Service modules expose one named class with schema-derived operations. Next.js Query mounting follows the official TanStack docs; top-level RSC shells and Prefetch never await, and pending-query hydration stays optional.
- React work consults the composition skill. Modern React with React Compiler, compiler diagnostics in CI, and configurable web build/dev-startup budgets are part of the adoption plan.
- Effect RPC + Effect Schema are selected. Internal RPC derives directly from the API without codegen. The generic query adapter and single-source OpenAPI projection are still integration work to prove.
- Markdown examples are annotated design sketches, not a runnable application. The separate legacy Zod contract slice has executable behavior checks and now uses feature colocation; it does not test the selected Effect integration. The kit does not claim that those checks validate React Native, RSC, streaming transports, or an entire product.
- A [focused lint package](skills/fernando-product-engineering/scripts/lint/package.json) implements feature-effect/transport restrictions, registered resource dispatch, DS purity, and a public Query integration gate. Broader graph rules and the generated product starter remain backlog. Adopting products supply real Query/lifecycle fixtures; the lint regressions do not prove a product SDK exists.
- “No impossible states” is a modeling requirement. Runtime validation, authorization tests, and integration checks still matter; no skill can guarantee bug-free software.

For the next review, use [the decision list](docs/architecture.md#decisions-to-review). Concrete code is provided so that changes can be discussed against an actual proposed shape.
