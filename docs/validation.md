# Validation record

## Revision 0.6 — executable architecture adoption, September 13, 2026

Added the focused ESLint profile and public Query integration acceptance runner under `skills/fernando-product-engineering/scripts/lint`. Updated the skill and affected references to prohibit portable-feature effects, require derived Query for React server state, keep reusable lifecycle policy in the vanilla SDK, use exhaustive workflow dispatch, separate subscription owners, and keep vendor protocols out of generic DS components. Replaced conflicting guidance rather than adding an exception to it.

Independent verification passed **37 regression tests**, syntax checks, a clean locked dependency install, public package import, and installed CLI invocation. The final direct dependencies are ESLint 10.10.0, TypeScript 5.9.3, typescript-eslint 8.70.0, and TanStack Query lint plugin 5.102.8. Packaging checks caught a symlink-entrypoint bug that could skip CLI execution; it was fixed and gained a permanent regression. Unknown-role and malformed-configuration fixtures ensure common configuration mistakes fail visibly. The supplied skill validator, Markdown links/anchors, and whitespace checks passed. See the [exact commands, outcomes, and fixture limits](../skills/fernando-product-engineering/scripts/lint/tests/VERIFICATION.md).


The Query gate regressions use an explicitly synthetic SDK to test the gate's behavior. They do not implement or verify a production Effect-to-Query adapter, mounted provider isolation, browser input, or cloud connection recovery. Adopting products still supply and review those acceptance fixtures. The broader graph-rule catalog and full product starter remain backlog.

## Earlier draft 0.5 validation

Checked September 12, 2026.

## What was checked

- Verified current primary documentation/source for Effect HTTP/RPC separation, version differences, OpenAPI streaming support, React Query pending hydration, and React identity. Citations live beside the claims in the skill references.
- Parsed the skill's YAML frontmatter with the available `yaml` package; checked its name, description, and allowed fields. Checked local Markdown link destinations/source line bounds, linked heading anchors, and balanced code fences.
- Compiled the executable contract fixture with strict TypeScript and ran its behavioral tests. See [its README](../eval-outputs/contract-slice/README.md) for the exact command, dependency versions, scope, and limits.
- Ran an independent forward test of the skill against a new/existing/forwarding composer request with URL versus modal state, RSC prefetch, native reuse, and retained draft/focus. This was an architecture exercise, not a mounted UI test.

The bundled Python skill validator was attempted but could not import PyYAML in the available Python runtimes. The structural checks above used the existing Node YAML parser as a fallback; the standard Python validator did not pass or run to completion. No global packages were installed.

## Corrections from the forward test

1. A generic navigation library must expose URL primitives without importing feature schemas. Feature integration owns interpretation as chat selection.
2. RSC prefetch receives an explicitly constructed request-scoped client and non-secret cache identity. Portable SDK code does not implicitly read Next cookies.
3. Submission eligibility belongs to the implementer's operation. A shared button cannot assume that text is required for forwarding or attachment-only messages.

The forward test also produced the intended retention strategy: keep the actual input, provider types, and necessary layout ownership stable across route transitions, while route-specific content can change beneath a separate boundary.

## Not yet proven

The Markdown example book is a design proposal. It is not a compiled monorepo, production API, native build, rendered React implementation, or functioning RSC integration. Its unimplemented owned adapter APIs are identified as sketches. The executable fixture covers selected pure contracts and behaviors only.

Effect version/toolchain selection, OpenAPI code generation, streaming transport parity, framework builds, browser/native bundle isolation, query cache isolation, accessibility, source navigation, and mounted state retention require the acceptance work in the [enforcement roadmap](../skills/fernando-product-engineering/references/enforcement.md). Lint rules and a starter repository have been specified but not implemented.


## Revision 0.2 checks and scope

The revised skill adopts feature-local schemas, a dedicated inferred RPC package, API-derived query integration, and ESM public namespace composition. The executable fixture was reorganized to remove its central contracts file and keep schemas beside their domain owners; its 17 behavioral tests and strict TypeScript compilation pass. Zod remains legacy test wiring, not the selected production schema choice.

The Effect v3 API declarations/client inference snippets were checked against official source, but Effect dependencies were not installed and this is not a compiled Effect transport integration. The proposed generic query-options and OpenAPI projections remain explicitly unimplemented adapter work. No per-operation handwritten interface is offered as a substitute.

The Next Query example targets the documented Query 5.101.4 API; recheck the installed exports when adapting it. The example now includes the client-marked provider and correct server/browser QueryClient lifetime. Next itself was not built or mounted in this architecture-kit task.


## Revision 0.3 checks and scope

The root SDK now has one proposed `createClient` interface and an explicit `./react` query surface. Vanilla roots, framework-specific folders/slash exports, optional peer metadata, public-only barrels, and type-only server API references are documented with concrete recipes. Feature `api.ts` now means server binding, with the client-safe wire declaration in colocated `rpc.ts`.

Effect's client source was inspected again: runtime payload encoding/result decoding requires a real RPC group. The type-only Api import is erased; the separate runtime schema barrel intentionally remains in the client graph. The kit does not claim that a type-only import can construct Effect's runtime client.

The workspace example now isolates panels/composer subscriptions in distinct provider wrappers. React's official documentation supports children-based wrapper isolation; changed-context consumers and their own updates still render. This is a source-backed example, not a measured React render-count test. No React mounting test or full SDK/adapter implementation was added in this documentation revision.


The Prefetch proposal now accepts `query={async ({ client, query }) => { ... }}`. That earlier revision awaited setup before dehydration; this blocking pattern has been superseded by the synchronous Prefetch correction below. This batching helper is documented with inferred context types; it has not been mounted/tested as a Next integration.


After the batched-prefetch and provider-isolation revisions, structural checks passed for 14 Markdown files and 113 local links/anchors. All 131 fenced blocks were balanced; 117 TypeScript/TSX/JSON snippets passed syntax parsing. This is not semantic typechecking or runtime validation of the architecture sketches. The rule recipes now cover 25 instructions with individual examples.


## Revision 0.4 checks and scope

Promoted the complete SDK/new-client test, potentially publishable packages, single API-owned runtime definitions, consumer type safety/performance, and variable execution environments into the top-level goals. New API-bearing feature examples use `api/{schema,rpc,index}.ts` within the owning core feature; compact earlier layouts are explicitly identified as equivalent, not additional schema owners.

Added five instruction recipes and a runtime/harness reference with local/sandbox composition. External SDK research informed one illustrative server/client creation example; it does not select the architecture or establish an implemented worker protocol. No execution host or sandbox was started. New performance, packed-package, and second-client checks are specified as future acceptance work.

Renamed the headless workspace composition to `ChatWorkspaceProvider` throughout, including its props naming, and added provider-role naming guidance and a proposed lint/review rule. These changes do not implement or measure a mounted provider.

Structural checks passed for 15 Markdown files, 125 local links/anchors, 148 fenced blocks, skill frontmatter, and syntax parsing of 130 TS/TSX/JSON snippets. Runtime/Effect/React semantic validation remains limited to the evidence and fixture scope described above; no product runtime code changed.


## React Compiler and CI follow-up

Made the composition-skill check explicit for React writing/refactoring, with a disclosed fallback when unavailable. Reduced the external coding-SDK example to independent server/client creation and their optional combined lifecycle. Added modern React/React Compiler guidance based on official installation, lint plugin, logger, and debugging documentation, with the distinction between lint diagnostics and an actual compiler transform.

Specified future web build and usable dev-startup timing gates. Numeric budgets remain unset by design until the target web repo defines them. No CI job, compiler integration, build benchmark, or dev server was run: this follow-up changes the skill/roadmap only. Markdown syntax, links, frontmatter, and code-example syntax were checked after editing.


## Feature hook ownership follow-up

Made components consumers of feature-local hooks and helpers, with React-specific state/actions/data-source coordination in hooks and reusable product logic in vanilla SDK/core. Query hooks retain an owned resource contract so data-source changes need not rewrite UI. Added an optional provider-owned hook example with explicit sharing/lifetime semantics, updated earlier query examples, and proposed import/ownership lint checks. Consulted the composition skill's state-interface and implementation-decoupling rules. No runtime implementation changed; hook and provider examples remain design sketches.


## Query tracking, Suspense, and routing correction

Replaced eager query-result normalization in default feature hooks with an unchanged tracked result and a deliberate narrow public type. A temporary strict TypeScript check against installed Query 5.101.4 passed for status/data/error discrimination, hidden observer methods, and defined Suspense data. A QueryObserver runtime probe measured 0 notifications during a same-data background refetch when only data was read, versus 2 when fetch state was eagerly read or the result was spread. No React render-count or compiler interaction is proven by that observer test.

Official Query/React/Next documentation and a read-only routing research pass informed the optional Suspense hook contract, conditional route-hook suspension, stable promise-through-context approach, live URL distinction, and event-time history updater. The proposed `params.then` projection, real provider fan-out, history/RSC request behavior, and state retention remain explicit production-fixture TODOs. No Next application or server was created or run for this correction.

## Ergonomic type-helper follow-up

Added the required consumption shape for `InputOf`, `OutputOf`, `ResourceOf`, and `SuspenseResourceOf`, deriving from an inferred operation or its options factory. Updated feature hook/resource examples to use helpers instead of repeating Parameters/ReturnType plumbing or requiring aliases in a contract file. Resource helpers remain type-only; the runtime query result stays untouched.

The helpers are specified with generic adapter ownership, vanilla versus React export boundaries, no-input/error/operation-kind semantics, and future inference/performance acceptance tests. The full RPC/query adapter and these helper exports have not been implemented or semantically typechecked here. The earlier executable type projection check still proves only the underlying narrowed Query result type; it does not prove the new operation-to-helper inference chain.

## Example refresh, service exports, and nonblocking RSC

Updated the example book and recipes to the feature-local `api/{schema,rpc,index}.ts` layout and one named `UsersService` class per service module. API bindings reference its methods directly. The class returns Effects with injected dependencies; it contains no request singleton. Method-level tree shaking is an accepted tradeoff, not a verified optimization.

Refreshed the consumer examples with operation-derived input/output/resource helpers, actual feature-hook declarations, unchanged tracked query results, explicit Suspense hooks, local routing readers, and the shared execution capability. These remain proposed adapters, not compiled production implementations. The legacy Zod behavior fixture remains intentionally separate.

Corrected Prefetch to a synchronous RSC wrapper that does not await request setup, preparation, or data. The request-query accessor must actually be synchronous; callbacks register queries before yielding, and dehydration includes pending promises. Required async key inputs belong beneath a local Suspense boundary. Rechecked the official TanStack streaming and Next SPA guides. A focused probe against installed Query Core 5.101.4 verified that synchronous registration produces a dehydrated pending promise which subsequently resolves; registration after an asynchronous gate does not retroactively enter an already-emitted snapshot. This is a Query Core test, not a rendered Next/PPR/instant-navigation test.

Checked the skill frontmatter, Markdown links/anchors and fences, and syntax of the code examples after editing. Semantic validation of the full Effect SDK, generic type helpers, React Compiler behavior, and Next request integration remains outstanding.

## Central mutation defaults

Added one proposed `setMutationDefaults(client)` SDK React export, invoked once by module-defined QueryClient construction before providers mount. Internal mutation policy stays feature-local. Updated the provider/prefetch examples so generic libraries do not import the product SDK and server caches remain isolated. Generated mutation options must preserve mutation keys and must not override registered cache-lifecycle callbacks.

A focused installed Query Core 5.101.4 probe passed: defaults execute without local callbacks, invalidate only matching cached queries in their own client, and explicit mutation callbacks override the defaults rather than automatically composing them. This last behavior is captured in the planned enforcement checks. The SDK installer/key derivation remain design examples; no production adapter was implemented. Skill frontmatter, 161 local links/anchors, and 158 code-example syntax checks passed across 16 Markdown files.

## Query-key consumption correction

Removed the separate operation-key surface from the mutation policy example. Keys now belong to the API-derived query operations: `.key` denotes an operation-wide prefix; `.getOptions(input).queryKey` denotes a complete bound input/scope key. Exact invalidation explicitly uses `exact: true`. Clarified that the earlier users policy invalidates all by-ID entries, including scopes within that QueryClient, and that mutation variables do not automatically belong in mutation keys. The adapter's shared unbound descriptors/bound options remain proposed implementation work. Official TanStack query-invalidation/options documentation was checked; Markdown/link and code-syntax checks passed. No runtime implementation changed.

## Direct mutation results

Updated mutation-hook examples to return `useMutation(...)` directly with inferred types. React Query is an accepted primitive in the React layer; returning its full mutation API/state union is an explicit exception to broad vendor-result restrictions. Query hooks retain their existing type-only projection. Migration tradeoffs and centralized-defaults ownership are documented.

Inspected installed React Query 5.101.4 `useMutation` and mutation result declarations, plus official documentation/source: its hook subscribes to mutation observer snapshots via `useSyncExternalStore`, without query-style property-read tracking. No selective mutation-render optimization is claimed. Structural checks passed for 16 Markdown files, 163 local links/anchors, and syntax parsing of 161 code examples. No mounted React benchmark or production SDK implementation changed.
