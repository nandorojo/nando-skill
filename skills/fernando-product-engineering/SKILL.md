---
name: fernando-product-engineering
description: Build and review products using Fernando Rojo's contract-first architecture, owned dependencies, portable SDKs, and compositional React features. Use when designing product layers, APIs, SDKs, React providers, cross-platform features, or enforcing these conventions in a repository that adopts them.
---

# Fernando's product engineering

A product is a function of its API. Define each operation once, colocate it with its feature, and derive its consumers. Encapsulate complexity in owned libraries. Features compose portable parts; apps select implementations. These are Fernando's conventions for repositories adopting this skill, not claims about the only valid way to write software.

## Required adoption contract

For a new product or affected architectural boundary, establish these before implementing its UI:

- Application bootstrap is app-owned, not feature-specific: keep root layouts, document markup, global provider mounting, and client lifetime setup in the app. Root setup may import owned SDK/library entry points directly; do not invent a `features/app` feature to satisfy feature-only imports.
- Use one shared browser `QueryClient` and one `QueryClientProvider` at the application composition root by default. Feature providers own observers/local state, not separate Query caches. New features reuse this setup; server requests remain isolated. See [cache ownership](references/react.md#one-app-cache-many-feature-observers).
- Write the public SDK consumption call site, derived Query consumption, provider ownership, and meaningful state-rendering tree. Assign each boundary an implementation owner before delegating parallel work.
- Use the [executable lint profile and integration gate](references/enforcement.md#executable-adoption-profile). Register actual feature, SDK React, host-adapter, and design-system roles; require the affected checks in CI. Missing infrastructure is work to implement, not permission to replace it with ad hoc fetching. A small product scope does not waive its chosen architecture.
- Portable feature components **and hooks** contain no `useEffect` or `useLayoutEffect`. Server requests use the SDK's derived React Query integration; subscriptions use owned SDK React adapters. Host synchronization stays in registered adapters. Reusable sequencing, retry/backoff, recovery, cancellation policy, and protocol interpretation belong in vanilla SDK/core.
- Dispatch workflow/resource state exhaustively and compose distinct substantial state presentations. Preserve ordinary Query results and data-first rendering; do not invent a universal state wrapper. Independently updating resources have separate subscription owners. Generic DS components contain no product/vendor protocol interpretation.
- Read affected references in bounded sections and recover truncated output before implementing those requirements. Report functionality and architecture evidence separately. Raw RPC calls from Node do not prove a complete SDK; exercise the product lifecycle without copied feature logic.

Apply these gates to the changed boundary; do not scaffold unrelated clients or features for a narrow edit. The lint profile enforces specified syntax/origins, while lifecycle completeness and provider independence need the acceptance fixtures described in enforcement.

## Overall goals

Build the **Ruby on Rails for JavaScript**: an opinionated, coherent set of patterns, folder structures, contracts, and tooling for a modern product across N clients and multiple useful levels of abstraction. A greenfield app should inherit these decisions instead of reinventing them. Keep each layer independently consumable; add layers when they own a real responsibility.

- **The API is enough to reimplement the product across N arbitrary clients.** A Swift app, Next.js app, CLI, or MCP server must be able to reproduce the product's capabilities through documented public API routes and protocols, without importing app internals or reverse-engineering a TypeScript SDK. Almost all core product logic lives behind those operations in owning backend services; route handlers bind that logic rather than becoming monoliths.
- **The SDK is a small, justified consumption layer.** Derive API access and add only necessary client-side helpers, local connection behavior, and explicit language/framework adapters. A complete SDK makes another client convenient to build; it must not become a second backend or the only specification of product behavior. Every handwritten addition needs a concrete consumer need and a reason the API or an existing primitive cannot supply it. See [the SDK admission test](references/client-sdk.md#justify-handwritten-sdk-behavior).
- **One consumable product, extensible internals.** Offer one coherent root client with discoverable namespaces. Keep it updatable and extensible through feature-local modules and deliberate public exports; consumers must not assemble a catalog of services or know implementation files.
- **Packages are built for consumption.** Assume every package could be published to npm and used outside this repo. Actual publication is optional. Apps consume packages as sources of truth; packages must not reach back into apps or require unpublished workspace details.
- **One definition of each type.** Public runtime schemas originate in the owning feature's API area by default; static types, RPC, OpenAPI, and external generated clients derive from that owner. Never maintain the same contract twice. Local UI state and injected capabilities still belong beside their actual owner.
- **Strong types and speed are product requirements.** Preserve inference, source navigation, runtime validation, and explicit failures while measuring consumer typecheck/IDE performance, bundles, startup, calls, and streams. Do not achieve speed by weakening the boundary to `any` or skipping validation.
- **Clients and execution environments vary independently.** The same agent product may have a mobile client, cloud orchestration, and a local or sandbox tool runner. Inject execution capabilities at the authorized host boundary; shared features never decide where Bash runs.
- **Make conventions enforceable.** Use custom lint, export/dependency graph checks, consistent feature layouts, and behavioral acceptance tests. Implement deterministic rules first; a skill alone cannot enforce the architecture.

The acceptance questions are: can an independent client reproduce the product using the documented public API and protocols, and can an SDK consumer do so conveniently with complete types and no copied app logic? Name the necessarily local helpers and their purpose. An SDK demo alone does not prove API completeness. See [runtime and harness composition](references/runtimes.md) and [enforcement](references/enforcement.md).

## Dependency injection is a foundational pattern

Consumers declare the capabilities they need through narrow contracts; the composition root supplies their implementations and owns their lifetime. Apply this throughout the stack: React context providers supply state/actions, Effect services declare dependencies fulfilled by layers, and SDK/harness roots bind transport, storage, identity, and execution. Real, mock, local, and remote implementations satisfy the same contract without changing consumption code.

Inject at the boundary that owns the choice, not necessarily one global app root. Keep dependencies explicit and scoped. Prefer ordinary arguments when sufficient; do not introduce a container, duplicate service interface, or factory for every function. Dependency injection should make implementations replaceable while keeping call sites simple.

## Working sequence

Use the [vertical-slice build sequence](references/build-sequence.md) for both a greenfield product and every API-bearing feature. Design the consumer contract first, implement from core outward, and verify the complete user flow. A finished layer is a checkpoint, not a finished feature.

1. **Choose one outcome and trace its owners.** Inspect the repository and instructions. Write the desired SDK call and UI tree, meaningful success/failure states, and acceptance scenario. Consult `vercel-composition-patterns` before React work. Identify which layers already satisfy the contract, which must change, and which do not apply.
2. **Define the core contract.** Declare feature-owned runtime input/result/error/event schemas and Effect RPC operations once in `core/features/<feature>/api`. Derive types. Specify authorization, lifecycle, and injected capabilities before consumers depend on them.
3. **Implement core behavior and bind the API.** Add only needed persistence/owned dependency adapters, implement the feature service, then bind authorized handlers into the composed API and existing host mount. Verify validation, failures, and service behavior through that boundary.
4. **Complete and prove the public SDK.** Derive RPC from the composed API; add only justified local interpretation and lifecycle behavior under the [SDK admission test](references/client-sdk.md#justify-handwritten-sdk-behavior). Exercise the actual operation and relevant recovery/cancellation through a public non-React consumer. Do not leave missing behavior for UI hooks to invent or compensate for an incomplete API in the SDK.
5. **Connect the React data boundary.** Extend the existing derived Query integration and centralized mutation policy, or bind an SDK subscription for a live stream. Verify public options/types and cache/lifetime behavior. Reuse shared infrastructure; never hand-register another operation catalog.
6. **Compose the feature and host.** Implement thin feature hooks, independently owned providers, exhaustive state readers, and DS content/state parts. Inject host capabilities through the feature's explicit platform entry point; apps mount that composition. Wire the real SDK path before considering the UI integrated.
7. **Verify the vertical slice.** Follow a real UI action through SDK/RPC/API/core and back into rendered state, including its relevant failure/recovery path. Run the affected architecture and behavioral gates; record actual evidence separately from mocks and untested paths.

Greenfield work establishes only the shared foundation needed by the first slice, then completes that slice before expanding the product. Existing-feature work reuses that foundation and changes only the necessary owners. UI-only work can reuse an unchanged verified SDK without manufacturing backend changes. Parallel DS/state presentations may use an explicit contract-compatible mock after contracts are agreed; real integration remains dependent on the SDK/data boundary. See the reference for checkpoints and delegation rules.

## Non-negotiable design constraints

- Prefer a single typed entry point for configuration and environment parsing per runtime boundary. Apps supply deployment URLs/base paths; public factories resolve defaults once, and internals consume resolved configuration. Avoid scattered env reads and inline URL/path literals outside their owning defaults or constants. Prefer env-backed configuration with safe fallbacks where deployment variation is useful. See [configuration ownership](references/configuration.md).

- Follow the [code styleguide](references/styleguide.md): comment only on non-obvious reasoning or constraints; use Oxlint for linting and Oxfmt as the single formatter. Preserve architecture and React Compiler checks not yet covered by a verified migration.

- Any logic that can live on the server belongs there. Shape backend operations around the client outcome; resolve dependent reads and mutation prerequisites on the backend instead of requiring client waterfalls. Queries remain safe reads, including on automatic refetch; backend policy decides which dependent data needs fetching. See [server-owned orchestration](references/contracts-backend.md#server-owned-orchestration-and-safe-queries).
- Treat client `useEffect`/`useLayoutEffect` as a severe architectural smell. Do not use them except for an extreme, documented host/subscription synchronization requirement that cannot be expressed through the existing owned primitives. Portable feature components and hooks have no effect allowance. See [React ownership](references/react.md#components-consume-hooks-hooks-adapt-the-sdk).
- Never manage promise lifecycle manually in React. Use `useTransition` for basic async actions and `useQuery` or `useMutation` for complex or data-based operations. Never coordinate promise loading, results, or errors with manual `setState` calls. See [promise ownership](references/react.md#never-manage-promises-manually).
- Avoid arguments/options that select different implementations, such as `surface(kind: 'terminal' | 'computer')`. Expose explicit operations/components and compose shared capabilities beneath them; this applies across backend, SDK, and React APIs. Ordinary data/configuration arguments and schema discriminants describing actual states remain valid. See [composition instead of mode arguments](references/contracts-backend.md#compose-operations-instead-of-mode-arguments).
- In React, prove exhaustive state handling with `satisfies never`; do not call runtime-throwing `assertNever` helpers for impossible states. Validate unknown input at its boundary and present typed failures. See [workflow dispatch](references/ui-states.md#exhaustive-workflow-dispatch).

- Prefer one source of truth and as little new state as possible. Store IDs for selected/referenced entities and resolve them from existing network/query data; derive and recompose values instead of copying fetched objects or synchronizing derived state. Form state owns user edits, never a duplicate fetched entity. Explicit network/cache layers own intentional caching. See [minimal state and derived forms](references/react.md#minimal-state-and-derived-forms).
- Separate library ownership from consumption. Ugly, sensitive, reusable, or protocol-specific implementation belongs below features/apps, even if it currently has one caller.
- Prefer one primary ("true") export per implementation file, especially pages, screens, components, and hooks. Give each independently consumable page its own descriptive file; public barrels assemble them. Related types, schema modules, and cohesive library helpers are exceptions. See [file structure](references/boundaries.md).
- Prefer absolute imports within packages too. Public consumers use `@example/...` exports; private internal wiring uses configured package-private absolute aliases without self-barrel cycles or cross-package bypasses. See [import policy](references/boundaries.md).
- Organize by feature first, never by global code-type buckets. For new API-bearing features, use `core/features/<feature>/api/{schema,rpc,index}.ts` beside `service.ts` and `db.ts`. Never create a second schema owner when reorganizing it. No global contracts package/directory.
- Use **core feature API declarations → composed API → inferred internal RPC → complete vanilla client SDK → UI features → apps**. OpenAPI and generated external SDKs are a parallel derivation, not a codegen prerequisite for internal clients.
- The RPC package derives all internal methods/types from the composed Effect RPC group. One generic integration derives query options. Do not add handwritten `TransportSdk`/`ProductClient` mirrors or per-domain `createService`/`createQueries` scaffolding.
- A domain service module exports one named class, such as `UsersService`, with operations as methods. Prefer static Effect-returning methods when Effect owns dependency injection; no global request state or standalone duplicate method exports. This deliberate service boundary can accept a method-level tree-shaking cost; React parts still use ESM module composition.
- Keep platform folders minimal: only code that adapts an actual host capability belongs there. Extract reusable React composition into shared components with neutral props; a transitive framework hook still makes its caller an adapter. Filenames must describe their primary export and role, not a copied example domain.
- Package roots are vanilla. React/Next/Bun adapters live in explicit folders and slash barrels (`rpc/react`, `client-sdk/react`, `api/next`, `api/bun`), with optional framework peers where applicable. Root imports and declarations must resolve without these peers.
- Name SDK React injection `ClientSDKProvider`, distinct from `QueryClientProvider`; use `sdkClient` and `queryClient` when both are in scope. Query SSR/hydration and Suspense cache retention do not determine SDK lifetime. Never copy Query’s `environmentManager` factory into SDK setup; choose SDK scope from actual credentials, mutable state, and resource ownership. See [SDK initialization](references/client-sdk.md#sdk-initialization-is-independent-of-query-hydration).
- Publish a complete `createClient()` from the client SDK root. For React products with server state, expose and consume the derived Query integration through `./react`; it is optional only for consumers that do not use React. Construct an instance once per intended lifetime; infer its methods rather than hand-registering them.
- Treat typed consumption as part of the API design. Derive discoverable query/mutation descriptors, options factories, and typed defaults registration from operation declarations. Callers should not need raw tag strings, `satisfies ApiOperationTag`, explicit generics, or repeated payload/result aliases for ordinary usage. Prefer `mutation.sessions.send.setDefaults(queryClient, { onSuccess(session) { /* inferred */ } })` and bound `.mutationOptions()`; keep HTTP verbs in transport metadata. See [typed mutation consumption](references/client-sdk.md#typed-mutation-consumption).
- Query keys come from the inferred operations: `.key` is an operation prefix; `.getOptions(input).queryKey` is the full input/scope key. No parallel key registry. Use `exact: true` for exact invalidation.
- Configure each QueryClient once through the single `setMutationDefaults(client)` export from `client-sdk/react`, in module-defined provider/client setup. It owns feature-local invalidation and mutation cache policy; hooks must not duplicate or override that lifecycle. Keep server QueryClients isolated.
- Server `Api` imports in client code use `import type`. Effect runtime codecs come from a separate client-safe RPC/schema barrel; do not pretend a type-only import can supply `RpcClient.make` its runtime group.
- App and feature source imports owned entry points only. Wrap or narrowly re-export dependencies; never wildcard re-export a vendor to evade this rule. Type imports count. See the explicit compiler/tooling/host policy in [boundaries](references/boundaries.md).
- Follow schema → DB → service → API responsibilities. A feature-local `api/rpc.ts` declares Effect's wire contract; `api/index.ts` binds authorized services for mounting (the expanded form of `api.ts`). Service code imports declaration leaves, never the API implementation barrel.
- Make package exports intentional and consume packages only through approved public barrels; block all private/deep/source/alias bypasses. Raw DB implementations are private. Browser/RSC callers use the inferred RPC/client surface, never a service or DB shortcut. Declaration-only core feature schema/RPC public barrels are safe when their graph contains no server implementation. Explicit trusted-local clients may receive authorized core capabilities at their composition root.
- Model data, errors, and events with runtime schemas and infer static types. Declared API errors have globally unique stable codes and schema-typed payloads; consumers handle their union exhaustively. Normalize unexpected failures at the owned boundary. Action signatures refer to those types; do not attempt to encode React nodes or function implementations into OpenAPI.
- Make derivation effortless at call sites: provide `InputOf<typeof operation>`, `OutputOf<typeof operation>`, and React-specific `ResourceOf<typeof queryOperation>` / `SuspenseResourceOf<typeof queryOperation>`. Support an inferred query operation and its `getOptions` factory without repeated `Parameters`/`ReturnType` plumbing or handwritten per-route aliases. These helpers derive from the same operation metadata/types; they never define another contract. See [type-helper consumption](references/client-sdk.md#derive-types-from-the-operation-in-front-of-you).
- Render query UI data-first: keep available data during refresh, show errors alongside it through shared DS notices, and distinguish initial loading, disabled, offline, empty, and pagination states. Extract resolved content and composable state components usable by ordinary queries and Suspense. Read [UI states](references/ui-states.md).
- Represent legal states explicitly. Initial absence, disabled input, offline waiting, success-empty, success-content, and stale data with refresh errors are different states. Never use list emptiness as a loading test.
- Client SDKs own necessary local product interpretation, protocol assembly, and reusable client lifecycle policy after the API ownership test. Exporting the raw RPC catalog is insufficient when another client still needs to copy necessary local sequencing, retries, recovery, or error interpretation from React. That does not justify inventing controllers for ordinary operations or moving server workflows into the SDK. Feature code must not invent enum labels/order/tone or reconstruct transport patches.
- Components consume hooks and compose UI. Feature-local hooks coordinate controllable React state, actions, derived Query results, and owned subscription adapters. They must not use effect hooks or implement reusable product algorithms; those belong in the vanilla SDK/core they call. Merely extracting component logic into a custom hook does not satisfy SDK ownership.
- Encapsulate `useQuery`/mutation/subscription usage in feature-local hooks with deliberate input/result contracts. Derive query options from the API as before; do not duplicate route schemas, keys, or client methods. Expose a deliberate narrow type; preserve the tracked query result rather than eagerly normalizing/spreading it. Mutation hooks deliberately return the complete inferred `useMutation` result: React Query is an accepted core primitive here. Preserve its state union instead of rebuilding an action facade; do not claim mutations have query-style property tracking. Other vendor surfaces still need an explicit consumption contract. A provider may call the hook once per intended owner and distribute its result when shared state/subscription lifetime is needed. See [React hook boundaries](references/react.md#components-consume-hooks-hooks-adapt-the-sdk).
- Name headless state/context components for their role: `ChatWorkspaceProvider`, `ChatWorkspacePanelsProvider`, and `ChatWorkspaceComposerProvider`. They provide behavior to children; visual components use names such as `ChatWorkspaceScreen`, `Panels`, or `Frame`.
- Split wrappers for actual independently updating state, not merely because two dependencies are different objects. A single app `Providers` component can mount Query and SDK context directly without forwarding-only wrappers. Independently updating state hooks live inside separate feature context wrappers that consume the shared app QueryClient; this never implies a QueryClient or QueryClientProvider per feature. The parent that composes those wrappers has no combined subscriptions and passes children through; do not make every provider rerender whenever one domain updates.
- Allocate submission IDs on submit, not draft edits. Optimistic chat input clears immediately; failed messages retain their own retry action through scoped mutation-cache subscriptions. Separate session-query and composer providers, and destructure stable functions before capturing them in handlers. See [composer lifetimes and handler dependencies](references/react.md#capture-handler-dependencies-during-render).
- New React code targets modern React (19+) with React Compiler enabled. Run the repository's compiler-diagnostic lint after React changes and in CI; inspect the reason/location of failures and skips. Verify the real build runs the compiler. See [React compiler guidance](references/react.md#modern-react-and-react-compiler).
- Web CI enforces configured maximum build and dev-startup seconds. Define readiness and cold/warm cache conditions explicitly; record failures and do not silently raise thresholds. See [CI timing budgets](references/enforcement.md#web-build-and-dev-startup-budgets).
- React components consume headless `state`, `actions`, and `meta`/capabilities contracts. Public `state` contains controllable values; derived eligibility (`canSubmit`), submission lifecycle/errors, and imperative refs belong in `meta`. Controllers may use internal state machines without exposing their lifecycle as patchable state. Implementer hooks satisfy these interfaces; dependency injection changes behavior without coupling the consumer to a provider's source.
- Prefer typed `patch`, `replace`, and `reset` draft actions over one updater per field; controllers own validation and legal lifecycle transitions. Use flat domain props such as `id={id}` for a detail view; transport hooks may still accept input objects.
- Compose explicit trees using children and compound components. Do not add `isNative`, `isNewChat`, or similar mode booleans to choose product trees. Ordinary booleans like `disabled` remain valid state/semantic props.
- Keep suspending reads near the consuming boundary. A stable promise may pass through context and be unwrapped with `use` at the leaf; a resolved server value/promise is not a live URL subscription. Never inject custom hook functions through context. See [routing/Suspense](references/platforms.md#route-reads-suspend-where-they-are-consumed).
- Preserve React identity when the product requires retained draft/focus/scroll. Separate initial compositions do not justify replacing live provider types during a transition.
- Shared feature source renders owned DS primitives, never host tags or React Native primitives. Web defaults are unsuffixed; `.native` and optional `.ios`/`.android` files implement the same contract. Avoid runtime platform branching in shared features and DS.
- Keep top-level RSC shells synchronous for SPA-first instant navigation and partial prerendering. Never await data, params, credentials, or prefetch preparation there. Register pending queries without awaiting; resolve unavoidable prerequisites in children below local Suspense boundaries.
- For Next.js React Query provider setup and hydration, read the official TanStack Advanced Server Rendering/Next guide for the installed version; it is authoritative. Wrap its integration once with owned imports. RSC prefetch is optional; the same feature works without it. See [platforms](references/platforms.md).
- Use a single barrel layer at each consumed public export boundary. That entry point re-exports implementation modules directly; do not chain internal folder/feature barrels into another barrel. Internal wiring imports implementation modules through private aliases. A file named `index.ts` that implements behavior is not a barrel merely because of its name. See [barrel ownership](references/boundaries.md#one-barrel-at-the-consumed-export-boundary).
- Compose owned public APIs with named ESM exports, `export *`, and `export * as`, not monolithic `export const X = { ... }` registries. Keep server/client/platform graphs separate and verify the selected bundler. Vendor wildcard exports remain prohibited.

- Pixels are sacred: every heading, control, status line, and reserved area must justify its permanent cost. Review host and embedded UI as one screen; remove redundant chrome, consolidate duplicate intents, and keep secondary capabilities out of the primary workspace unless the task needs them. See [pixels are sacred](references/ui-states.md#pixels-are-sacred).
- Preserve visual continuity through loading, errors, retries, and background updates: reuse content geometry and visual anchors; show mutation progress on its trigger without resizing it. Test transitions and internal positions, not only final screenshots or CLS. See [UI-state continuity](references/ui-states.md#visual-continuity-across-asynchronous-states).

## Read the relevant reference

| Task | Reference |
| --- | --- |
| Greenfield or per-feature implementation order, layer handoffs, end-to-end completion | [Build sequence](references/build-sequence.md) |
| Comments, linting, formatting, Oxlint/Oxfmt adoption | [Code styleguide](references/styleguide.md) |
| Package boundaries, imports, public exports, folder conventions | [Boundaries](references/boundaries.md) |
| Typed env parsing, URL/base-path defaults, app and SDK configuration ownership | [Configuration](references/configuration.md) |
| Schemas, core services, authentication, API/OpenAPI/Effect selection | [Contracts and backend](references/contracts-backend.md) |
| Inferred RPC, external SDK, domain helpers, streams, automatic query options | [Client SDK](references/client-sdk.md) |
| New clients, coding-agent harnesses, local/sandbox execution, in-process API | [Runtimes](references/runtimes.md) |
| Browser geometry, screenshots, CI evidence, and limits of layout lint | [Visual verification](references/async-visual-verification.md) |
| Query result tracking, narrow resource types, optional Suspense hooks | [Query resources](references/query-resources.md) |
| Context interfaces, provider implementations, legal states, composition | [React](references/react.md) |
| Data-first rendering, shared loading/error/empty parts, pagination, Suspense | [UI states](references/ui-states.md) |
| Web/native contracts, routing adapters, SPA/RSC integration | [Platforms](references/platforms.md) |
| Concrete consumer-first call sites and code patterns | [Example book](references/examples.md) |
| A code snippet for each architectural instruction | [Rule recipes](references/recipes.md) |
| Lint rules, architecture checks, acceptance gates, next implementation work | [Enforcement](references/enforcement.md) |

Read only the relevant references for a small change. Read boundaries and the affected layer before a new feature. For a new full-stack product, inspect all affected layer references in bounded reads; use the relevant example-book sections to make the consumption story concrete. An issued read command is not evidence its truncated contents were received.

## Instruction-to-code map

Use these recipes when applying the corresponding rule; the example book shows the larger assembled story.

| Instruction | Code |
| --- | --- |
| Consumer first | [1](references/recipes.md#1-write-the-consumer-before-the-implementation) |
| Vanilla roots and explicit integration folders | [2](references/recipes.md#2-vanilla-roots-and-explicit-framework-folders) |
| Public-only imports and optional peers | [3](references/recipes.md#3-package-exports-and-optional-peers) |
| ESM barrels and runtime client instances | [4](references/recipes.md#4-barrels-publish-modules-factories-construct-instances) |
| Owned dependencies | [5](references/recipes.md#5-own-third-party-imports-once) |
| Feature colocation | [6](references/recipes.md#6-colocate-by-feature) |
| Schema inference | [7](references/recipes.md#7-infer-types-from-the-runtime-owner) |
| Wire declaration versus API implementation | [8](references/recipes.md#8-separate-wire-declaration-from-mounted-api) |
| Type-only server references and runtime codecs | [9](references/recipes.md#9-type-only-server-imports-and-intentional-runtime-codecs) |
| Complete client SDK | [10](references/recipes.md#10-expose-the-whole-product-from-one-root-client) |
| Derive consumer types from operations/options factories | [Type helpers](references/client-sdk.md#derive-types-from-the-operation-in-front-of-you) |
| Central mutation defaults and invalidation | [31](references/recipes.md#31-register-mutation-policy-once) |
| Automatic query options | [11](references/recipes.md#11-derive-one-query-interface) |
| Root dependency injection | [12](references/recipes.md#12-inject-once-at-the-composition-root) |
| Service authorization and DB scope | [13](references/recipes.md#13-service-authorizes-db-applies-scope) |
| Domain display semantics | [14](references/recipes.md#14-keep-product-meaning-in-the-sdk) |
| Stream assembly | [15](references/recipes.md#15-hide-stream-assembly-below-features) |
| Legal loading/empty/error states | [16](references/recipes.md#16-state-explicitly-distinguishes-loading-and-empty) |
| Headless contracts and mocks | [17](references/recipes.md#17-headless-contracts-and-explicit-mock-implementers) |
| Explicit workflow composition | [18](references/recipes.md#18-compose-workflows-instead-of-mode-flags) |
| Retained React identity | [19](references/recipes.md#19-keep-identity-where-retention-is-required) |
| Web/native DS contracts | [20](references/recipes.md#20-shared-props-web-and-native-implementations) |
| Routing injection | [21](references/recipes.md#21-routing-is-injected-through-feature-integration) |
| Official Next Query integration | [22](references/recipes.md#22-follow-the-official-next-query-mounting-recipe) |
| API host adapters | [23](references/recipes.md#23-publish-through-explicit-host-adapters) |
| Acceptance checks | [24](references/recipes.md#24-check-the-consumption-boundary-not-just-the-source-layout) |
| One state owner per provider wrapper | [25](references/recipes.md#25-each-provider-owns-its-own-state-hook) |
| API-owned schemas without losing colocation | [26](references/recipes.md#26-put-public-schemas-in-the-owning-features-api-area) |
| A complete SDK for different clients | [27](references/recipes.md#27-build-another-client-from-the-same-sdk) |
| Publishable packages and controlled consumption | [28](references/recipes.md#28-test-a-package-as-an-external-consumer) |
| Independently replaceable execution environments | [29](references/recipes.md#29-inject-where-tools-run) |
| Strong types with measured performance | [30](references/recipes.md#30-check-type-safety-and-speed-together) |

## React composition lineage

Fernando identifies his React Universe composition talk as the source of the installed `vercel-composition-patterns` skill. For every task that writes or refactors React code, consult that skill and read its relevant `architecture-avoid-boolean-props`, `architecture-compound-components`, `state-context-interface`, `state-decouple-implementation`, `state-lift-state`, `patterns-explicit-variants`, and `patterns-children-over-render-props` rules. Reuse guidance already read in the current task. If the skill is unavailable, report that and use this kit's self-contained React reference as a fallback; do not silently imply that the composition skill was checked.

Apply the composition principles rather than copying every example literally: this kit further requires owned DS imports, runtime-schema state, and explicit legal states. Use React APIs supported by the target version. React 19 supports `use(Context)` and ref props; `useContext` remains supported. Do not turn a style preference into a false claim that React removed an API.

## How to finish a task

Make the call site clean and reviewable. Adding an API operation should update inferred RPC/types/query helpers automatically; duplicated consumer scaffolding is a failed boundary. Explain the changed contract, where its implementation lives, how it composes in another context, and the verification actually performed. Name unresolved framework/version assumptions. Do not promise portability, tree shaking, auth safety, or bug freedom on the strength of types alone.

Keep architecture acceptance separate from functional acceptance. Record the lint/profile configuration and results, the public Query consumer checks, and the second-client lifecycle and provider-ownership evidence relevant to the change. A working demo, green compiler, or passing import checker cannot mark an untested architecture requirement passed.
