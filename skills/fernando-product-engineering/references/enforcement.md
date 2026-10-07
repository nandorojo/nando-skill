# Enforcement specification and implementation backlog

Status: the focused [executable adoption profile](#executable-adoption-profile) ships with this skill. The broader rule catalog below remains a specification/backlog unless marked implemented. Do not report the whole catalog enforced because the focused profile passes.

## Linting and formatting

Use Oxlint and Oxfmt per the [code styleguide](styleguide.md). The executable architecture profile below currently runs on ESLint; keep it alongside Oxlint until its custom and type-aware checks have a verified equivalent. Tool adoption must not silently drop architecture or React Compiler diagnostics.

## Executable adoption profile

The portable npm package in [scripts/lint](../scripts/lint/package.json) exports an ESLint flat-config factory and the `nando-query-gate` CLI. Use its [configuration and CLI contract](../scripts/lint/README.md) to adopt the profile. Copy the skill directory intact or install the package from its local path. Install its locked dependencies and run its regression suite before adopting or changing the profile. Keep the package lockfile; no global installation is required.

```sh
npm --prefix path/to/fernando-product-engineering/scripts/lint ci
npm --prefix path/to/fernando-product-engineering/scripts/lint test
```

Register source roles in the adopting repository's lint configuration. Effects are allowed only in deliberate SDK React/host adapters, not a folder merely named `adapter`. Resolve symbol provenance through named imports, aliases, namespaces, and owned re-exports so changing the import spelling cannot authorize a feature effect. Keep role coverage and adapter scope reviewable; an unregistered file is not evidence of compliance.

| Gate | Required behavior | Limit |
| --- | --- | --- |
| `no-feature-effects` | Reject React `useEffect`/`useLayoutEffect` in portable feature components and hooks, including owned re-exports. | Only extreme, individually justified host/subscription synchronization exceptions may use effects in registered adapters; server-capable logic stays on the backend and necessarily local reusable lifecycle stays vanilla. |
| `no-feature-transport` | Reject raw networking primitives and configured transport/protocol origins in portable features. | Known APIs can be detected; arbitrary domain algorithms require review. An owned RPC call alone is not a raw-network violation. |
| `resource-state-dispatch` | Require registered workflow/resource presenters to use exhaustive discriminant dispatch; reject conditional bypass and catch-all state defaults. | Register actual discriminants/presenters. Query data-first guards are valid; do not normalize every Query result. |
| `design-system-purity` | Reject configured product imports and vendor protocol markers/operations in generic DS source. | Neutral iframe/DOM mechanics remain valid; configuration must identify the actual protocol owners. |
| `required-query-integration` | Validate the SDK public React surface and run the adopting product's compile, behavior, lifecycle, and evolution fixtures. Missing required checks fail. | Exit status proves only what the configured fixtures assert; inspect their content. It does not infer SDK completeness from names. |

The profile also uses existing nested-ternary and type-aware switch-exhaustiveness rules. Exhaustiveness must not accept a default branch as coverage of a new union member. Nested-ternary lint is a readability restriction, not proof of valid state modeling. Query lint complements these gates; verify it observes the owned wrappers actually used by the product instead of assuming an installed plugin analyzes every re-export.

### Query and SDK acceptance fixtures

The CLI runs a checked-in adopting-repo configuration; fixture commands are executable code and must be reviewed like CI configuration. Require these independent checks:

1. **Compile:** import the real SDK through its public React subpath; exercise inferred query/mutation options and a representative feature hook with strict types. No private source import or handwritten method mirror may stand in for the public consumer.
2. **Behavior:** execute the actual Query setup and feature integration. Verify client lifetime/cache identity and centralized mutation policy, plus initial versus retained-data states. Mount two different features under the real app setup: assert they receive the identical QueryClient, share a cached operation for the same input/scope, and observe cross-feature mutation invalidation. Route changes must retain that browser cache. Separate server requests/test cases must not share it. Merely exporting a function with the right name is insufficient.
3. **Second client:** exercise the product's reusable lifecycle from a non-React consumer. For a connection product, include cancellation, disconnect/reconnect, terminal failure, retry limits, and non-replay semantics as applicable. Keep any fake transport explicit; do not copy feature algorithms into the test client.
4. **Evolution:** add an operation to an isolated API fixture and demonstrate automatic RPC/type/query inference without editing a client registry. Add an error/state variant and demonstrate an incomplete handler fails typechecking. Restore fixture state or use a temporary workspace.

The bundled lint regressions prove the checker rejects known violations and accepts valid boundaries. They do not implement a product SDK or replace these adopting-product fixtures. An export check, an empty test, a command that only prints success, or a Node client invoking raw endpoints must not be presented as lifecycle or Query acceptance.

### Server ownership and composition review

Trace each client request chain. Backend-resolvable dependencies must become one outcome-shaped operation; prove query refetches cannot start work or mutate product state. Review the vanilla SDK too, since moving a waterfall there does not fix ownership. Check explicit operations compose shared pieces without mode/options dispatch. Treat client effects as extreme, individually justified adapter exceptions; a registered adapter path alone is not justification. React exhaustiveness uses `satisfies never`, never a runtime-throwing assertion. These are review requirements, not claims that the bundled lint profile detects every case.

### Provider and state-model review

Review SDK initialization independently from Query setup: require an actual credential/state/resource reason for lifetime branching, and reject importing Query environment detection into vanilla SDK construction. Check that resource-owning SDK instances have cleanup owners; do not mandate request-local instances for a demonstrably stateless client. Query hydration must not be presented as SDK hydration.

Classify root layouts and global provider/client setup as app bootstrap, not portable feature code. Review that one app-level QueryClientProvider encloses feature providers, and that SDK context and Query cache have distinct documented responsibilities. Reject forwarding-only provider chains without an actual lifetime/subscription/reuse need; different dependency objects do not establish that need. App bootstrap may import owned SDK/library entry points directly.

Keep `provider-state-owner` advisory: counting hooks cannot determine independent ownership. Require a reviewable owner map and a mounted fixture showing an update in one resource does not invoke an unrelated subscription owner. A provider can use multiple hooks implementing one cohesive responsibility. Validate ancestor/prop changes separately from resource updates.

For discriminated workflow states, add negative type/schema fixtures for contradictory combinations (for example, connected plus an expiry failure) and a new-variant exhaustiveness fixture. Successful rendering of a few branches does not prove impossible states are unrepresentable. Extract substantial pending/content/failure presentations while preserving identity during refresh.

### Regression contract

Maintain both rejected and accepted fixtures: effect imports through aliases and owned barrels; raw transport versus registered adapters; vendor-aware DS versus neutral primitives; missing/new workflow variants and conditional dispatch; missing Query surface/checks versus a real consumer; ordinary semantic ternaries versus nested state branching. Exercise the actual ESLint profile and CLI, including nonzero exit behavior. These guards should fail the prohibited ownership patterns without requiring a live sandbox.

## What each mechanism can prove

| Mechanism | Appropriate guarantee |
| --- | --- |
| Formatter | Stable whitespace, quotes, wrapping, import presentation where configured |
| ESLint AST rule | Syntactic imports, JSX host usage, restricted exports, obvious mode flags |
| Type-aware lint | Symbol origin, forbidden vendor types leaking through a public surface |
| Dependency graph check | Resolved aliases/re-exports, illegal layer edges, cycles, browser-to-server reachability |
| TypeScript/build | Contract conformance, schema-derived type usage, actual platform resolution |
| Codegen contract check | Deterministic generated output, spec/client drift, compatibility changes |
| Behavioral tests | Authorization, transitions, protocol assembly, cancellation, cache isolation |
| Human/AI review | Whether an interface is small, portable, compositional, and pleasant to consume |

Do not claim an AST rule proves authorization, understands all business semantics, or guarantees tree shaking. A rule banning functions named `getUser` would not prove anything useful about security. A schema name cannot prove it is validated at the right boundary.

## First rule set: hard boundaries

The names below are proposed `@fernando/architecture` rule IDs.

| ID | Scope / diagnostic | Enforcement and fix policy |
| --- | --- | --- |
| `owned-imports` | App and feature source imports external package directly | Resolve normal/type/dynamic imports, require, and re-exports; allow declared source-role exceptions only. No autofix until an exact compatible owned replacement is known. |
| `layer-imports` | Resolved dependency goes upward or crosses a prohibited surface | Check path/alias/package export maps; include same-package layers. Graph pass handles transitive imports. No automatic move. |
| `public-entrypoints` | Consumer reaches a private file or non-exported subpath | Forbid source traversal and export-map bypasses; private same-domain imports remain allowed. |
| `absolute-source-imports` | Handwritten source uses relative code imports/re-exports | Prefer approved package/self subpaths or configured private package imports; permit scoped assets/framework/generated exceptions. Resolve targets, reject barrel cycles and private export bypasses; no blind string-only autofix. |
| `declared-direct-dependencies` | Package imports an undeclared transitive dependency, or apps duplicate unused internal packages | Validate resolved imports against each manifest and host/peer/tooling needs. UI apps normally depend directly on features; API mounts and trusted host composition retain explicit dependencies. Do not auto-delete peers or runtime-loaded dependencies. |
| `no-host-jsx` | Shared features/apps render intrinsic host tags | All lowercase JSX elements, including svg/iframe/custom tags; required document-shell adapter explicitly scoped. No automatic div→View substitution. |
| `no-native-primitives` | Consumer imports RN primitives outside registered DS/native adapters | Direct import rule plus symbol provenance through re-exports where possible. |
| `no-vendor-prop-surface` | Public component props derive wholesale from a vendor component | Type-aware check of ComponentProps/extends/intersections/aliases; require owned neutral prop contract. Review intentional foundational facades separately. |
| `no-wildcard-vendor-export` | Adapter re-exports all of a vendor | AST error on export-star; named export inventory required. |
| `no-platform-switch` | Shared UI uses Platform.OS, target checks, or platform-mode props | Use resolver-selected adapters or injected capabilities; distinguish environment feature detection inside approved adapter. |
| `rsc-boundary` | Portable feature/client module imports RSC/server subpath | Check explicit module roles and graph, not directory-name regex alone. |
| `no-core-consumer-import` | RSC/browser/portable feature imports core/API implementation/DB | Allow declaration-only feature schema/RPC public subpaths; only designated API hosts and trusted-local roots receive implementations. Inspect transitive graph. |
| `no-app-reachback` | Package imports app source/assets | Move owned assets/capabilities downward; don't exempt relative image imports. |
| `no-server-root-barrel` | Client entry point reaches server/native-only runtime code | Transitive graph/build check, with browser/native/server conditional exports evaluated separately. |

Source roles must be configured rather than inferred solely from folder names. A malicious or accidental rename to `generated` cannot confer exemption. Native implementation files and DS-owned dependency adapters are allowed to import the specific dependencies they own.

## Package defaults and provider isolation

| ID | Signal | Enforcement |
| --- | --- | --- |
| `vanilla-root` | Root runtime or declarations reach React/Next/host adapter | Transitive runtime/type graph check; require explicit framework slash barrel. |
| `adapter-peer-scope` | Root needs a peer declared optional for an adapter | Isolated consumer import/typecheck without that peer; validate optional peer metadata and actual adapter requirements. |
| `type-only-server-api` | Client imports a value from server API barrel | Type-aware import/re-export rule; `import type { Api }` allowed. Safe runtime codecs use the declared `api/rpc` barrel instead. |
| `rsc-nonblocking-shell` | Top-level RSC shell or Prefetch awaits data/setup before returning its tree | Advisory boundary-aware lint and production streaming test; await only inside explicitly bounded children. Check query registration occurs before dehydration. |
| `provider-role-name` | Headless state/context wrapper lacks `Provider` suffix, or provider hides application layout | Configured naming rule plus review; keep compound `.Provider` exports valid. Syntax cannot prove whether all descendants render UI. |
| `provider-state-owner` | One composition component subscribes to independent state used by several providers | Advisory AST/review rule; move each hook into its own children-taking wrapper. Do not claim syntax alone proves render counts. |

For the provider rule, add a behavior fixture in the future React suite: panels-only updates should not rerun the composer provider/hook when it does not consume panels context; composer-only updates should not rerun panels; changed-context consumers must still update. Check parent-prop and ancestor-route changes separately.

## Colocation and derivation rules

| ID | Signal | Enforcement |
| --- | --- | --- |
| `feature-colocation` | New global contracts/schemas/types/services/hooks buckets | Configured source ownership check. Default public schemas to feature-local `api/schema.ts`. Generic library capability folders are valid; do not infer ownership from names alone. |
| `no-rpc-method-mirror` | Handwritten interface/object repeats the API's method catalog | Advisory/type-aware provenance plus acceptance test: adding an operation updates RPC without touching client wrappers. No regex pretending to prove this universally. |
| `no-per-route-query-factory` | A factory restates one operation's payload/key/function | Require the shared API-derived integration for mechanics; permit colocated domain-specific semantics. |
| `esm-public-namespaces` | Public API assembled as `export const X = { importedFunctions }` | Prefer ESM named/star/namespace re-exports. Actual runtime instances and ordinary data maps remain valid objects. |
| `primary-export-per-file` | Page/screen/provider implementation contains multiple independent primary exports | Configure file roles; require separate named files and a deliberate barrel. Permit private helpers, associated types, context/accessor pairs, schema/library modules, and required framework exports. Review independence; raw export count is insufficient. |
| `role-file-name` | Filename hides its primary responsibility, such as `provider.tsx` exporting only `QueryProvider` | Require names matching the primary export/role (`query-provider.tsx`, `route-existing-note.tsx`); catch stale sample names such as `messages.tsx` exporting `RouteExistingNote`, with framework/barrel exceptions; review shell responsibilities and repeated pass-through wrappers. Do not auto-flatten state/Suspense boundaries. |
| `service-export` | Domain service module exports standalone operations or multiple public service objects | Require one named service class; methods remain schema-derived. Permit private helpers. Class method tree shaking is not promised. |
| `single-schema-owner` | Same public operation payload/result maintained in multiple places | Advisory review/type provenance; test route/client drift. Different wire/domain/UI state shapes remain legitimate. |
| `consumer-type-helpers` | Feature repeats low-level input/output/resource inference or redeclares API-derived shapes | Prefer the SDK's `InputOf`/`OutputOf` and React `ResourceOf`/`SuspenseResourceOf`. Advisory for repeated plumbing, hard provenance checks for duplicated contracts where provable; generic adapter code may use the underlying TypeScript utilities. |

The primary acceptance condition is observable: adding a core feature operation changes the inferred RPC/types and generic query surface automatically, with no TypeScript codegen or per-method client registration. OpenAPI metadata lives with its operation; generated external SDKs remain allowed.

## Complete SDK, publishable packages, and execution hosts

| Check | Acceptance |
| --- | --- |
| Second-client exercise | Build a small CLI or MCP client using the public SDK alone; exercise sequencing/recovery/cancellation/non-replay behavior where the product has it, with no copied app logic or handwritten API payload/result types. Raw endpoint calls prove transport only. React is optional. |
| Packed-package consumption | Import and typecheck the packed artifacts from an isolated project outside workspace path aliases. All runtime/declaration dependencies and files are present. Publication itself is not required. |
| Schema provenance | Each public payload/result/error/event has one runtime owner in its feature API area. Inferred types and generated language DTOs trace to it; they are not independent definitions. Distinct UI state schemas remain valid. |
| SDK evolution | Add a route and observe automatic internal inference; diff generated OpenAPI/external output. Detect incompatible public changes before publishing affected packages. |
| Type performance | Measure representative small and large consumers with TypeScript diagnostics and editor navigation/completion. Record baseline and product-specific budgets; reject `any`/casts that hide lost inference. |
| Runtime performance | Measure cold client startup, bundle graph, call overhead, stream memory/backpressure, and cancellation. Root imports must not eagerly start optional hosts or connections. |
| Execution capability | Local, sandbox, and fake implementers pass the same scope/cancellation/terminal-event suite. Consumer UI has no process or sandbox implementation import. |
| Worker transport | Validate assigned identity/workspace, disconnect behavior, and duplicate/ambiguous task handling. Reconnecting must not silently execute a non-idempotent command twice. |

AST lint cannot prove that two arbitrary types mean the same thing or that a package is fast. Use provenance/review for semantic duplication, packed-consumer builds for package integrity, and measured acceptance for performance. Store the selected layout/profile and performance budgets in repo configuration so future AIs do not invent a new convention on each task.

## Second rule set: contract and composition discipline

| ID | Signal | Classification |
| --- | --- | --- |
| `schema-derived-data` | Exported DTO/state alias is handwritten instead of schema-derived | Type-aware allowlist by contract role; function/ref/capability interfaces excluded. Not a blanket ban on interfaces. |
| `exhaustive-state` | Discriminant switch misses a legal member | Prefer existing type-aware exhaustiveness tooling; never autofix to a silent default. |
| `no-empty-as-loading` | Null/undefined and `.length === 0` share loading branch | Narrow AST heuristic warning initially; review semantics. Behavior tests remain authoritative. |
| `no-fetching-skeleton` | Skeleton selected only by background fetch activity | Heuristic warning; normalized initial state should drive skeleton. |
| `no-workflow-booleans` | `isNewChat`/`isNative` or prop-origin booleans choose large workflows | Flag known mode props; heuristic review for arbitrary names. Permit semantic state booleans and documented identity constraints. |
| `children-composition` | Structural renderX props or many showX flags | Advisory; data render callbacks like virtualizer renderItem are legitimate. |
| `no-conditional-implementer-hooks` | Implementation selects/calls hooks conditionally or receives a custom hook as a context/prop value | Use React hooks/compiler checks; inject values, promises, and ordinary capability functions while hook calls remain static. |
| `no-vendor-result-contract` | Public feature contract exposes the entire query/router observer surface | Allow intentional narrow type-only Query resource projections that preserve the tracked runtime result; do not require an eager normalization wrapper. Allow the deliberate full `useMutation` result without normalization; do not flag that accepted primitive. Adapter-specific query options remain valid. |
| `query-result-tracking` | Eager result normalization, spread/rest, or blanket notifications broaden subscriptions | Use official Query no-rest-destructuring lint plus review for spreads/helper reads; test observer notifications and mounted context fan-out. |
| `operation-key-owner` | Parallel key registry, handwritten endpoint keys, or full-input invalidation mistaken for exact matching | Require inferred operation `.key`/options `.queryKey`; test prefix/full-key agreement, scope isolation, and explicit exact matching. |
| `mutation-defaults-owner` | Feature hook repeats invalidation or overrides centrally registered lifecycle callbacks | Require the SDK installer at QueryClient creation and matching generated mutation keys; review intentional callback composition. Test behavior because defaults can be overridden. |
| `feature-data-hook` | UI component directly invokes a query/mutation/subscription adapter | Resolve symbols to owned data adapters and configured component/hook roles; require a feature-local hook. Keep imperative RSC prefetch valid and do not flag context accessors. |
| `component-logic-owner` | Component body or nested callbacks contain substantial product logic or state/action coordination | Advisory review: controllable state and action wiring belong in feature hooks; effect lifecycles belong in registered SDK React/host adapters, and reusable product logic in vanilla SDK/core. Do not ban all branches, local variables, helper calls, or event wiring. |
| `no-feature-status-map` | Feature maps product enum to canonical labels/tone/order | Advisory with configured known domain enums; semantic ownership needs review. |
| `no-feature-protocol-assembly` | Feature parses wire chunks, patches JSON, or implements protocol sequences | Advisory/import restrictions around known transport helpers; general AST cannot determine every protocol. |
| `neutral-platform-contract` | Shared contract imports DOM or RN implementation types | Type-aware check scoped to shared component contracts; approved opaque semantic handles allowed. |
| `declared-export-surface` | Runtime symbol exported outside intended package API | Check export map and designated public modules; generated SDK surface tracked separately. |

Do not let advisory rules become noisy ritual. Promote one to an error only after representative valid and invalid fixtures demonstrate useful precision.

## Proposed configuration contract

This is the broader intended configuration shape, **not the executable profile's API**. Use the bundled lint package's exported factory for the implemented subset:

```ts
defineProductArchitecture({
  namespace: '@example',
  sourceRoles: {
    portableFeature: ['packages/features/src/**'],
    nextIntegration: ['packages/features/src/**/next/**'],
    rscIntegration: ['packages/features/src/**/rsc/**'],
    nativeIntegration: ['packages/features/src/**/native/**'],
    appEntry: ['apps/*/app/**', 'apps/*/src/**'],
    apiMount: ['apps/web/app/api/**/route.ts'],
  },
  // More specific roles override broad roles; overlapping equal-priority roles error.
  dependencyOwners: {
    react: ['packages/libraries/src/react/**'],
    '@tanstack/react-query': ['packages/libraries/src/query/**'],
    'next/navigation': ['packages/libraries/src/navigation/next.ts'],
    'react-native': ['packages/design-system/src/**/*.native.tsx'],
  },
  exceptions: [
    {
      files: ['apps/web/next.config.ts'],
      imports: ['next'],
      reason: 'Framework configuration types at the host boundary',
    },
  ],
})
```

The actual plugin must define resolution precedence, export condition handling, workspace package detection, JSX runtime treatment, generated code provenance, and path normalization on supported OSes. The snippet is incomplete intentionally; do not run it as if `defineProductArchitecture` already exists.

Dependency owners are narrower than “all libraries.” Register deliberate schema/React facades as foundational APIs. A library owning Query does not gain permission to import a feature. External test-runner imports have test-role policy, not product ownership.

## Rule fixture matrix

Before shipping each hard rule, test:

- Named/default/namespace/type imports, exports, dynamic imports, require, alias paths, and relative path escapes.
- Legitimate adapter import versus the same import in a feature, RSC entry point, config, and generated file.
- Private deep import via tsconfig paths, symlinked workspace package, and package exports.
- Distinct browser/native/server conditions and type-only versus runtime graphs.
- Host JSX in a DS implementation versus a portable screen; root document integration exception.
- `disabled` and `expanded` accepted while `isNative`/workflow modes are reported.
- Data-driven renderItem accepted; structural renderFooter flagged only under the configured advisory rule.
- A new enum member causes the owned metadata mapping/state renderer to fail meaningfully.

Diagnostics should say which boundary was crossed and show the expected owned entry point if one exists. Prefer actionable messages over generic “bad architecture.” Never auto-move code across security or package boundaries.

## Architectural acceptance suites

These sit next to lint and are not replaceable by it:

1. **API policy:** schema-invalid input, unauthenticated request, insufficient scope, cross-tenant access, missing record, public projection, and internal/external identity adapters.
2. **Contract pipeline:** add an operation and verify automatic internal RPC/type/query inference without codegen or client edits; spec generation from the same descriptors, stable operation IDs, declared errors, external generated client equivalence, source navigation.
3. **Streaming:** framing adapter, malformed events, out-of-order/duplicate policy, base-version mismatch, cancellation, early exit, terminal failure, immutable snapshots, memory bounds appropriate to the protocol.
4. **Query state:** initial disabled/loading/paused, success-empty/content, stale refresh/retry failure; cancellation and cache-key identity.
5. **Next Query integration:** mounting/client lifetime matches the official guide for the pinned version; synchronous Prefetch never awaits setup and dehydrates the same cache after synchronous query registration; void prefetch promises remain pending; stable browser instance across suspension; same feature with/without hydration; concurrent users remain isolated.
6. **Platform:** actual web/native builds, contract parity, no RN runtime in web output, no Next dependency in plain SPA, accessible primitive behavior.
7. **Composition:** new/existing/forwarding variants, sibling action access, alternate provider implementation, retained draft/focus/scroll across actual route transition.
   Include feature-hook contract conformance and an alternate data-source implementation without consumer edits. For a shared provider owner, verify subscription cleanup and shared state within its scope. Do not equate repeated hook calls with a single shared owner.
8. **Exports:** base RPC/client SDK importable without React or server implementation; declaration-only core schema/RPC subpaths allowed; browser bundle excludes DB/live layers/native-only dependencies; ESM namespace exports measured for bundle impact.

Run tests relevant to changed behavior. Do not demand an entire cross-platform release matrix for a spelling change. Conversely, a passing formatter is not adequate evidence for a new authorization or streaming adapter.

## Barrel optimization and bundle regression gates

Next apps must explicitly assess and configure package-import optimization for the owned barrels they consume, using the installed Next version's supported mechanism. The official [optimizePackageImports reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports) documents `experimental.optimizePackageImports`; verify its current status and support in the pinned version before adopting that experimental option. If it cannot support the repository's export shapes, use deliberate granular public entry points or another supported optimization and record the choice. `transpilePackages` is not evidence of unused-export elimination. Never bypass private exports to make a bundle smaller.

This configuration is necessary groundwork, not proof that every named/star/namespace barrel, side effect, or client/server boundary is optimized. CI must compare production output from the actual selected bundler:

1. Build a minimal representative route importing one feature through the supported public barrel. Include an intentionally unused sibling feature with a distinguishable implementation/dependency.
2. Compare the route's emitted client JavaScript (including shared chunks once each) against a checked-in baseline and configured raw/compressed byte budgets. Record the Next/bundler version, route, revision, and measurement method; keep server and client measurements separate.
3. Inspect the module graph to assert the unused sibling and server/native dependencies are absent. Also compare a fixture consuming a deliberate granular public entry point, where available, to expose barrel overhead. Exercise named and namespace consumption shapes actually promised by the skill.
4. Fail on a forbidden module or a configured byte regression. Require explicit review of baseline changes; missing measurements/budgets are TODOs, never passing evidence. Pin the toolchain and fixture inputs to make comparisons meaningful.

The fixture and CI scripts are a starter implementation TODO, not existing checks in this documentation kit. Separate file exports make this verification possible; they do not substitute for it.

## React Compiler in local checks and CI

Adopting React apps use modern React with React Compiler enabled. The owned lint configuration includes the pinned `eslint-plugin-react-hooks` recommended compiler diagnostics. Run the repo's `lint:react` script locally after relevant React edits and as a required CI job; run a compiler-enabled framework build as well. Lint success does not establish that the build applied the compiler. Configuration and failure investigation are specified in [the React reference](react.md#modern-react-and-react-compiler).

CI output should identify the file/component, rule or compiler diagnostic, and actionable reason. Inspect compiler skips instead of treating a successful build as proof that every intended component was optimized. Verify shared feature/DS source and owned React imports are analyzed. Investigate failures at their owner; a blanket lint disable or unexplained `use no memo` is not a fix. New repos use zero unaddressed warnings/errors; any existing-repo adoption exceptions are scoped and tracked.

This is an integration of official tooling into our checks, not a proposal to reimplement the React Compiler in a custom lint rule. The agent can run the same check whenever compiler behavior is uncertain. No React app or compiler configuration exists in this architecture kit to run it against yet.

## Web build and dev startup budgets

Build speed and development startup are explicit CI gates for web apps. Each adopting repo sets two numeric limits in seconds: **X_BUILD** and **X_DEV_START**. The values are intentionally undecided here. Once configured, a measured run above either limit fails the corresponding check; missing limits must not silently count as a pass. Do not raise a limit merely to make a regression green.

| Gate | Measurement | Failure |
| --- | --- | --- |
| `ci:build-budget` | Monotonic elapsed time from launching the production build command to successful completion, including its required package builds and compiler transform | Nonzero exit, timeout, or duration greater than X_BUILD |
| `ci:dev-start-budget` | Monotonic elapsed time from launching the dev command until an HTTP request to a configured representative app route returns the expected successful readiness content | Process exits, route fails readiness, timeout, or duration greater than X_DEV_START |

These are proposed repository script names, not implemented commands. A listening port or a bundler's “ready” log is insufficient if the first real page still needs compilation. Choose the route/readiness marker per app; do not accidentally measure an unrelated health endpoint or an existing server. Capture listening time separately if useful, while gating on usable app readiness.

```json
{
  "web": {
    "buildMaxSeconds": null,
    "devReadyMaxSeconds": null,
    "cacheProfile": "cold",
    "readyPath": "/"
  }
}
```

This is a planning example: `null` means X is not chosen yet, not unlimited. Replace both with positive numbers and configure the real readiness assertion before enabling the CI jobs. Keep the budgets and measurement profile versioned in the repo. The initial focus is web; add native/other host budgets when those hosts need their own measurements.

Use a documented runner class, pinned toolchain, and consistent environment. Install dependencies before starting the clocks; include any codegen/package builds required by the timed command. Define which build/dev caches are cleared for the cold profile, including remote task-cache behavior, so a cache hit cannot masquerade as a fresh build. Record warm-cache measurements separately if desired. Run startup independently of the build job's generated caches.

The harness records duration, limit, command, revision, cache profile, and logs; it owns a fresh server/port and cleans up its process tree after success, timeout, or failure. Enforce an outer timeout so a hanging process cannot stall CI indefinitely. Preserve failed measurements when rerunning an infrastructure issue; do not average away or silently retry a threshold breach until one run passes. Budgets are hard gates under the defined measurement conditions, not a promise about every developer's hardware.

These are timing/behavior checks alongside our linters. AST lint cannot measure a build or server startup. Implement the gates when creating the web starter, establish baselines, and investigate the slow stage when they fail.

## UI state and error acceptance

Use [UI states](ui-states.md) as the presentation contract. Verify behavior with actual retained query data rather than checking whether code contains an `isLoading` conditional.

| Check | Acceptance |
| --- | --- |
| Data-first refresh | Initial pending/error differs from background activity. Refetch, retry, and refresh failure retain visible usable content, list identity/scroll, and editable drafts. Errors with data appear inline. |
| Pagination | Loaded rows stay visible during next-page loading/failure; continuation feedback and retry are distinct from whole-list refresh. Successful empty data never becomes a loading state. |
| Context ownership | Public state contains controllable values; derived eligibility, operation lifecycle/errors, and refs belong in meta. Draft actions cannot patch metadata. Internal state machines remain valid. |
| Minimal platform adapters | Check transitive host dependencies. Route readers bind resolved IDs to reusable React composition; portable modules do not import host hooks indirectly. |
| Composable states | Page/region/inline states reuse DS primitives; ordinary and optional Suspense readers reuse feature content/pending/error parts. Review semantics rather than banning every text element. |
| Error contract | Distinct schema variants have globally unique stable codes; typed recovery payloads survive SDK decoding. Incomplete domain-error presenters fail typechecking when a variant is added. |
| Error disclosure | A wrong-team recovery payload is returned only after the server authorizes access/disclosure; denied callers cannot discover the alternate identifier. |

Extract the code inventory from authoritative schemas/operation declarations instead of maintaining another handwritten error registry. Code uniqueness and exhaustive switching can be checked mechanically; correct recovery, accessible presentation, and retained UI identity require behavioral checks/review.

## Implementation backlog

- [x] Ship the focused feature-effects/transport, state-dispatch, and DS-purity lint profile with a public Query acceptance runner; record its [regression and packaging verification](../scripts/lint/tests/VERIFICATION.md).
- [x] Exercise the revised skill through an independent bounded source review; generation of a complete compliant product remains a separate evaluation.
- [x] Adopt Fernando's corrections: feature colocation, no global contracts package, inferred RPC package, ESM public namespaces, official Next Query mounting guidance.
- [ ] Review remaining naming/formatting/error details against the revised examples.
- [ ] Pin and compile the selected Effect RPC + Effect Schema toolchain; complete the one-operation plus one-stream acceptance spike.
- [ ] Select/implement the generic RPC-to-query integration once; no per-domain option factories.
- [ ] Implement ergonomic type helpers in the same integration. Verify operation and `getOptions` inputs/resources agree, API edits propagate, no-input/optional payloads and errors remain accurate, incompatible kinds are rejected, and non-Suspense/Suspense narrowing is preserved. Root helper imports must remain React-free.
- [ ] Prove the single-source HTTP/OpenAPI projection using colocated operation metadata without schema duplication.
- [ ] Establish a dependency-owner inventory and a machine-readable layer/source-role policy.
- [ ] Implement `owned-imports`, `layer-imports`, `public-entrypoints`, and `no-host-jsx` first, with invalid and valid fixtures.
- [ ] Implement absolute source-import/private-import-map checks, primary-export/file-role checks, and per-package direct dependency validation with scoped exceptions.
- [ ] Configure and verify Next package-import optimization; add production barrel/unused-sibling fixtures, module exclusions, baseline byte comparisons, and reviewed bundle budgets.
- [ ] Add transitive server/client graph checks, export-map enforcement, and native/web resolution fixtures.
- [ ] Implement globally unique error-code validation and typed recovery/exhaustive error presenter fixtures; verify unauthorized errors cannot disclose alternate resources.
- [ ] Build shared DS state examples and data-first initial/refresh/pagination/Suspense behavior fixtures.
- [ ] Add schema-derived data and exhaustive state checks; keep semantic composition/status heuristics advisory initially.
- [ ] Verify vanilla root imports and declarations in consumers without React/Next installed; test explicit adapter imports with their optional peers.
- [ ] Add public-barrel-only enforcement across source aliases/relative paths, and type-only server Api enforcement.
- [ ] Add packed-package external-consumer fixtures and a second-client SDK exercise; prohibit undeclared dependencies and workspace/app reachback.
- [ ] Record consumer typecheck/IDE and runtime/bundle performance baselines; set budgets for the actual product and API scale.
- [ ] Enable React Compiler in the web pipeline and official compiler diagnostics in the owned lint config; add a required CI job and actionable failure/skip reporting.
- [ ] Choose X_BUILD and X_DEV_START for the first web app; implement required build/startup timing gates with defined cache, runner, readiness, logs, and cleanup behavior.
- [ ] Validate a harness execution capability with local, sandbox, and fake implementations, including authorization, cancellation, and reconnect ambiguity.
- [ ] Build a small real chat slice with mock and real providers, a DS pair, and optional RSC integration.
- [ ] Run the [query-resource acceptance checks](query-resources.md#acceptance-before-adopting-the-facade): tracking, union narrowing, direct/provider renders, Suspense reset/cancellation, and compiler behavior.
- [ ] Build the [production route-read fixture](platforms.md#production-verification-backlog): promise/value context versus live route reads, Cache Components cases, history updates, RSC requests, and retained UI identity.
- [ ] Generate a starter from the verified slice: consistent files, scripts, export maps, formatting, CI, and skill invocation.
- [x] Package the focused reusable lint/config tooling inside the skill for adoption without machine-specific absolute paths; remaining graph tooling is listed separately above.
- [ ] Add cross-language golden fixtures only when a second SDK language is introduced.
- [ ] Re-run a realistic independent skill evaluation after materially changing the conventions; correct demonstrated failures rather than accumulating speculative rules.

The focused lint package is an executable deliverable; remaining graph rules and a full product starter are still backlog. A starter must prove its actual generic API-to-Query integration and framework mounting before shipping. Do not turn the lint package's own fixture results into claims that the proposed product SDK is implemented.

## Asynchronous visual continuity acceptance

For affected UI, use deterministic browser requests or injected capabilities to hold query/mutation pending states, then release success, error, retry, and background updates. Assert stable internal text anchors, trigger dimensions, neighboring controls, and retained content bounds at desktop and narrow widths. Capture screenshots for visual review and verify focus/scroll retention, busy semantics, and readable error recovery. Include a failure case that the former mismatched layout fails; do not rely solely on final-state screenshots or aggregate CLS. Cover independent resource-status updates after mutation settlement when present. Follow [UI-state continuity](ui-states.md#visual-continuity-across-asynchronous-states).

For request holds, internal-anchor measurements, screenshot baselines, CI artifacts, and the limits of CLS and static lint, follow [asynchronous visual verification](async-visual-verification.md). This is a reusable adoption recipe; it does not claim these browser or lint gates are already installed.

## Integrated screen economy review

Review the ordinary and exceptional states of the whole composed screen, including embedded toolbars. Name the primary task, inventory visible headings/actions/status areas, and justify each permanent element. Flag duplicate user intents across host and embed, unnecessary context labels, and blank space reserved solely to satisfy geometry tests. Use the real embedded UI or a representative fixture that includes its chrome: an empty iframe can prove host geometry but cannot prove the combined screen has no duplicate controls. Assert concrete product decisions where practical, such as one reconnect affordance and no redundant title row; do not impose a universal pixel or button-count limit. Keep accessibility, recovery, and usable hit targets intact. See [pixels are sacred](ui-states.md#pixels-are-sacred).
