# Architecture enforcement

Install this directory as a local development dependency with the adopting repository's package manager. It supplies an ESLint 10 flat configuration and a separate Query acceptance gate. Use Node ^20.19.0, ^22.13.0, or >=24. It requires a TypeScript project, including for aliases and owned re-exports. Direct dependency versions are pinned and the lockfile records the verified dependency tree.

```js
import { createArchitectureConfig } from '@fernando/architecture-lint';

export default createArchitectureConfig({
  rootDir: import.meta.dirname,
  tsconfig: './tsconfig.json',
  sourceRoles: {
    portableFeature: ['packages/features/src/**/*.{ts,tsx}'],
    designSystem: ['packages/ui/src/**/*.{ts,tsx}'],
    statePresenter: ['packages/features/src/session/session-state.tsx'],
    hostAdapter: ['packages/features/src/session/web/browser-resume-adapter.ts'],
    sdkReact: ['packages/client-sdk/src/react/**/*.{ts,tsx}'],
  },
  protocolModules: ['@vendor/connection-protocol'],
  productModules: ['@product/client-sdk'],
  protocolMarkers: ['vendor:connection-ready'],
  discriminants: ['status', 'phase'],
});
```

Replace these illustrative paths and module names with an audited source inventory. Globs are relative to the ESLint configuration, as with ordinary flat config. Roles are additive; explicitly registered `hostAdapter` and `sdkReact` files are excluded only from portable-feature effect/transport prohibitions. No folder name grants an implicit exemption. Review changes to this inventory in CI; lint cannot determine whether a declared adapter truly owns host synchronization. Unlisted files are outside this profile.

The four custom rules reject React effect references (including aliases and resolvable re-exports), browser transport globals and registered protocol imports, configured product imports/markers in generic UI, and conditional dispatch of configured state discriminants. State presenters use finite literal discriminants with exhaustive switches; put a never assertion after the switch rather than in a default case. Ordinary Query data-first rendering should not be indiscriminately registered as workflow dispatch. SDK React and host adapters may use synchronization effects; the vanilla SDK owns transport/lifecycle policy and remains React-free.

The profile also enables `no-nested-ternary`, TypeScript ESLint's exhaustiveness check, and TanStack Query's exhaustive-deps, no-rest-destructuring, stable-query-client, and no-unstable-deps rules. Official Query rules recognize their supported Query imports; owned facades can reduce their coverage. Do not infer that this profile verifies every facade consumer.

## Required Query integration gate

Run `nando-query-gate ./architecture/query-gate.json`. All paths and commands use the JSON file's directory as their working directory. The JSON must contain:

- `sdkPackageJson`: the SDK package manifest path.
- `reactEntry`: an existing file targeted by its public `exports["./react"]` declaration. Build artifacts first when required.
- `requiredSymbols`: nonempty array of exports required by the chosen derived Query API, including its mutation-default installer. Select names from the accepted SDK contract rather than maintaining a duplicate operation catalog.
- `checks`: four entries named `compile`, `behavior`, `secondClient`, and `evolution`. Each entry contains a nonempty `fixture` file path and `command` array (executable followed by arguments). Optional `timeoutMs` defaults to 120000 per command.

The compile, behavior, and evolution fixtures must import the public SDK `/react` package; the second-client fixture imports its vanilla root. Commands must actually compile or execute those fixtures in the adopting repository. Use its real test/typecheck runner and fail on assertions. The gate first validates all configuration, public export targets, required symbol exports, files, and public imports, then runs every command without a shell. Missing prerequisites and nonzero commands fail the gate.

Review the fixtures: compile checks must use real feature consumers; behavior covers centralized mutation policy, resource states, and independent subscriptions; second-client checks execute reconnect/recovery/cancellation without copied React policy; evolution adds an operation and verifies inferred SDK/Query consumption without hand registration. The executable gate cannot inspect whether a configured test command tells the truth or whether arbitrary assertions prove these semantics. Public imports and symbol presence alone do not establish Query adoption or SDK completeness. This is intentionally an acceptance-command runner, not an automatic business-logic grader.

Known limits: this package is not a complete dependency-graph checker. It follows TypeScript-resolvable symbols, direct imports, and registered literal markers; reflective access, arbitrary wrappers and semantic protocol reconstruction need review. State dispatch identifies configured member discriminants and local aliases, not arbitrary interprocedural predicates. Configuration coverage, provider ownership, meaningful behavioral assertions, and real browser verification remain separate completion gates.
