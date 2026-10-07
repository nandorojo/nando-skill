# Review 2 — revised Grok 4.6 skill evaluation

**Verdict: mixed adherence, with good React composition and ownership signals but poor adherence to the defining API-to-SDK derivation requirement. Overall: 56/100 as a structural skill evaluation.** This is an improved design sketch, not evidence that the skill can yet generate a dependable multi-client starter.

The distinction matters: the README explicitly calls this a non-running structural mock. Returning 501, refusing RPC calls, and not persisting records are disclosed scope choices, not concealed production-success paths. However, mocking execution does not require duplicating the operation catalog, losing error contracts, or leaving the declared UI actions disconnected. Those are assessable architectural defects even in a mock.

## Method and rubric

I read the current skill and inspected the API, SDK, Query adapter, notes vertical slice, task counterparts, shared DS, host adapters, manifests, and enforcement sketch before reading review 1. The current README's repair table was encountered during that first pass; this was an independent source assessment, not a blinded experiment. I then read [review 1](review-1.md) to compare its recorded observations. No original-source snapshot is available, so improvements below are not a verified source diff.

The governing material is the [current skill](../../skills/fernando-product-engineering/SKILL.md), especially its [client SDK](../../skills/fernando-product-engineering/references/client-sdk.md), [contracts/backend](../../skills/fernando-product-engineering/references/contracts-backend.md), [React](../../skills/fernando-product-engineering/references/react.md), [boundaries](../../skills/fernando-product-engineering/references/boundaries.md), [platforms](../../skills/fernando-product-engineering/references/platforms.md), [UI states](../../skills/fernando-product-engineering/references/ui-states.md), [query resources](../../skills/fernando-product-engineering/references/query-resources.md), [runtimes](../../skills/fernando-product-engineering/references/runtimes.md), and [enforcement](../../skills/fernando-product-engineering/references/enforcement.md) references. Relevant example/recipe passages were cross-checked for attribution.

| Dimension | Available | Awarded | Basis |
| --- | ---: | ---: | --- |
| One API owner, inferred complete SDK and query surface | 30 | 10 | Good schema/API split; actual SDK/query catalogs are handwritten and disconnected from RPC inference. |
| Ownership, public surfaces, package consumption | 20 | 14 | Mostly appropriate layers, facades, slash exports; undeclared vendor dependencies and incomplete import consistency. |
| Headless React, state ownership, legal transitions | 20 | 13 | Strong explicit compositions/contracts; action guards, entity changes, and disconnected workspace actions remain. |
| Query presentation and declared error handling | 15 | 10 | Data-first rendering and central mutation policy; errors lose their typed/validated boundary. |
| Host composition and portable capabilities | 10 | 7 | Thin routes, local Suspense, shared parts; native ref parity and client lifetimes incomplete. |
| Verification/enforceability represented in the artifact | 5 | 2 | Honest mock labeling and policy sketch; no executable acceptance gate. |
| **Total** | **100** | **56** | **Partial, materially incomplete skill adherence.** |

These weights emphasize correctness and propagation over filenames. The score is a review judgment, not a benchmark probability. Confidence is **high** in the static architectural verdict, **medium** in conditional state-transition consequences, and **unestablished** for actual builds/runtime behavior. Production readiness is not separately scored: execution is outside this artifact's declared scope.

## What follows the skill well

- **Feature-local contract ownership:** [notes schema](packages/core/src/features/notes/api/schema.ts#L3), [wire declarations](packages/core/src/features/notes/api/rpc.ts#L12), [service](packages/core/src/features/notes/service.ts#L7), and [API binding](packages/core/src/features/notes/api/index.ts#L4) establish recognizable schema → DB → service → API responsibilities. The service uses injected actor/DB capabilities and scope is passed to persistence. This demonstrates structure, not proven authorization.
- **Client/server separation:** [RPC types](packages/rpc/src/types.ts#L1) reference the server API with `import type`; [runtime acquisition](packages/rpc/src/client.ts#L1) uses the separate client-safe RPC barrel. Public schema imports from core are not inherently forbidden server imports.
- **Headless composition:** [composer contract](packages/features/src/notes/composer/contract.ts#L5) separates controllable draft state, actions, and metadata. [new](packages/features/src/notes/screens/react/new.tsx#L8) and [existing](packages/features/src/notes/screens/react/existing.tsx#L10) screens compose parts explicitly. The [mock provider](packages/features/src/notes/composer/providers/mock.tsx#L7) supplies the same contract and makes preview failure explicit.
- **Data-first query rendering:** [note details](packages/features/src/notes/react/details.tsx#L16) and [list](packages/features/src/notes/react/list.tsx#L18) retain data and add refresh error notices. Empty, initial error, fetching, and paused branches are distinct. Tasks use the same essential data-first order. [Feature query hooks](packages/features/src/notes/react/use-note-by-id.ts#L8) return the Query result directly rather than spreading/normalizing it.
- **Appropriate shared ownership:** [status semantics](packages/client-sdk/src/features/notes/display.ts#L9) live in the vanilla SDK. [mutation defaults](packages/client-sdk/src/react/mutation-defaults.ts#L5) have one installer and feature-local policies; feature mutation hooks do not replace that lifecycle.
- **Useful boundaries survive the repair:** the [synchronous page shell](packages/features/src/notes/next/existing-page.tsx#L6) places params resolution below local Suspense. [NoteForId](packages/features/src/notes/react/note-for-id.tsx#L8) is portable and the [route reader](packages/features/src/notes/next/route-existing-note.tsx#L6) is a host adapter. [Workspace composition](packages/features/src/notes/workspace/react/index.tsx#L7) separates state owners. This nesting has a purpose; flattening it would not improve the architecture.

## Findings, ordered by impact

Severity here describes impact on this evaluation's acceptance question. P1 means a central contract is not met; P2 means a substantial incomplete boundary or conditional correctness defect; P3 means consistency/maintainability. None is a claim of a live production incident.

### 1. P1 — The SDK and Query surface repeat the operation catalog instead of deriving it

[Client](packages/client-sdk/src/client.ts#L19) manually declares every notes/tasks method and [createClient](packages/client-sdk/src/client.ts#L35) manually implements the same tree. [createQuery](packages/client-sdk/src/react/query.ts#L40) repeats the operation names again; [query](packages/client-sdk/src/react/query.ts#L59) is another key-only registry. The inferred [RPC type](packages/rpc/src/types.ts#L4) and [acquisition](packages/rpc/src/client.ts#L4) do not supply this SDK; its [manifest](packages/client-sdk/package.json#L13) does not even depend on RPC.

**Consequence:** adding an RPC operation does not add a client method or query helper automatically. Reusing schema types avoids duplicate DTO definitions but does not satisfy the skill's prohibition on method mirrors and parallel keys. This fails the most important acceptance criterion before any runtime execution is needed.

**Attribution:** explicit implementation noncompliance. The skill repeatedly forbids this exact structure. A contributing specification limitation is that its generic adapter remains proposed work, not a reusable implementation; that explains the implementation challenge, but does not authorize a handwritten replacement.

**Next step:** prove one descriptor-driven operation-to-client-to-query path, including operation category metadata; make the refusal/mock transport implement that same binding. Add a type fixture where a new API operation appears without SDK/query edits before expanding the catalog.

### 2. P1 — Declared errors and operation metadata do not survive the SDK boundary

The [Client methods](packages/client-sdk/src/client.ts#L19) expose plain promises with no preserved error metadata. [ResourceOf](packages/client-sdk/src/react/inference.ts#L4) extracts only data and defaults to the library's generic error type via [QueryResource](packages/libraries/src/query/react/resource.ts#L11). Its fallback cannot derive the data from a `getOptions` factory: [OutputOf](packages/client-sdk/src/inference.ts#L7) only recognizes promise-returning functions or operation objects, while that factory returns an options object. Helpers also have no operation-kind constraint to reject inappropriate mutation/stream usage.

Instead, the UI [interprets unknown errors](packages/features/src/notes/react/interpret-note-error.ts#L7) and asserts complete domain types after checking `_tag` alone. A tagged object with no valid `message` or recovery payload passes those assertions. The [transport failure schema](packages/client-sdk/src/failure.ts#L3) is declared, but not used here to normalize/validate failures. Both composer controllers discard caught failure details; e.g. [create](packages/features/src/notes/composer/use-new-composer.ts#L52). Tasks show generic strings rather than exhaustive declared variants in [details](packages/features/src/tasks/react/details.tsx#L30).

**Consequence:** another client must rediscover failure interpretation, and the convenient helper names overstate the metadata they preserve. The exact installed TanStack return-type compatibility was not compiled, so this review does not claim a measured compiler error for the conditional types.

**Attribution:** explicit departures from SDK-owned normalization, schema validation, typed errors, and operation/factory helper parity. The helper implementation itself is left open by the skill; its required outcomes are clear.

**Next step:** normalize and decode failures in the owned SDK transport adapter, preserve input/output/error/kind metadata once, and test operation/factory equivalence, declared-error unions, no-input operations, and rejected operation kinds. Keep rendering copy at a deliberate presentation boundary rather than using unchecked UI casts as the transport boundary.

### 3. P2 — Existing composer actions bypass their own eligibility and are not scoped to entity identity

[Notes existing composer](packages/features/src/notes/composer/use-existing-composer.ts#L16) holds one draft while its `noteId` prop can change. The draft is not keyed by ID or reset/reconciled on an ID change. [NoteForId](packages/features/src/notes/react/note-for-id.tsx#L10) changes context value without defining an entity-state policy. If that live tree is reused for note B after editing A, the old draft can be combined with B's fetched ID in [submit](packages/features/src/notes/composer/use-existing-composer.ts#L47). [Tasks](packages/features/src/tasks/composer/use-existing-composer.ts#L16) has the same shape.

Separately, existing `submit` checks only whether data exists, despite `meta.canSubmit` requiring a nonempty title and no pending submission. Direct callers of the public action can therefore bypass the disabled button's policy. New composer guards use render-captured submission state; a same-render double invocation is also not an atomic concurrency guard.

**Attribution:** explicit implementation gap. The React reference requires the action to recheck eligibility and enforce concurrency; retained identity is conditional on product intent, so blindly adding/removing a React key is not the prescribed fix.

**Next step:** define per-entity draft retention and submitted-revision behavior, enforce submission eligibility/concurrency inside the controller, and test A→B with dirty state and repeated submit. These are source-derived risks under a substitutable working/mock data source, not observed saves in the current refusing transport.

### 4. P2 — Workspace selection is writable state with no consumption path

[NoteList](packages/features/src/notes/react/list.tsx#L22) calls `actions.select(note.id)`, but [selection provider](packages/features/src/notes/workspace/react/selection-provider.tsx#L7) only writes `selectedId`. A repository search finds `selectedId` in declarations/provider wiring, with no reader that selects the editor or navigates. The editor instead reads [NoteId context](packages/features/src/notes/screens/react/existing.tsx#L11). Tasks repeat this pattern. The panels provider also exposes [move/order state](packages/features/src/notes/workspace/react/panels-provider.tsx#L8), while [PanelsRoot](packages/features/src/notes/panels/root.tsx#L7) renders children in their supplied order.

**Consequence:** even with populated query data, these provided actions have no represented effect on the product tree. This is not a backend limitation; it is incomplete UI wiring and unnecessary state.

**Attribution:** implementation incompleteness against minimal-state and consumer-first principles. Whether selection should navigate or drive an in-place editor is unspecified; either coherent choice is acceptable.

**Next step:** inject a meaningful selection/navigation capability or consume a single selected-ID owner; remove speculative panel state unless the UI actually supports rearrangement.

### 5. P2 — Publishable package boundaries are not complete in the manifests

The owned library imports [Effect RPC](packages/libraries/src/effect/rpc.ts#L1), [TanStack Query](packages/libraries/src/query/react/index.ts#L1), and Effect through its facade, but its [manifest](packages/libraries/package.json#L17) declares only framework peers and no dependency on `effect`, `@effect/rpc`, or `@tanstack/react-query`.

**Consequence:** the source graph expects vendor packages that this package does not declare. An installed parent workspace could mask that omission; a fresh packed consumer should not be expected to supply undocumented dependencies.

**Attribution:** explicit package-consumption rule not met. Source export targets and `private: true` are disclosed mock choices and are not the finding; this review did not test the wildcard private import maps in Node or a bundler.

**Next step:** pin the compatible dependency set in the owning package and prove a packed SDK consumer using only public entry points, including vanilla roots without React/Next.

### 6. P2 — Native TextInput omits a declared shared capability

The [shared contract](packages/design-system/src/text-input/react/contract.ts#L11) includes a mutable ref exposing `focus()`. The [web implementation](packages/design-system/src/text-input/react/index.tsx#L13) populates it; the [native implementation](packages/design-system/src/text-input/react/index.native.tsx#L4) neither receives nor binds it. The [composer](packages/features/src/notes/composer/input.tsx#L10) supplies that same ref on both platforms.

**Attribution:** direct contract-parity gap, independent of styling or native module resolution. No focus invocation was observed in this mock, so this is a promised capability missing from an implementation, not a reproduced user-visible failure.

**Next step:** implement the neutral focus handle in native and verify mount, focus, and cleanup against the same DS contract.

### 7. P2 — Client construction is repeated during render despite the intended lifetime

[Native provider](packages/features/src/app/native/provider.tsx#L17) and [Electron provider](packages/features/src/app/electron/provider.tsx#L17) evaluate both factory arguments on every render before `useRef` returns its retained value. [Next provider](packages/features/src/app/next/query-provider.tsx#L11) does the same for the product client. This retains the first client but still constructs discarded clients. Today those factories are cheap mocks; replacing them with resource-owning clients would require revisiting this lifecycle.

**Attribution:** explicit construct-once/lifetime rule not met; no leak is claimed for today's mock. The module-global [request client](packages/features/src/app/next/request.ts#L4) likewise does not demonstrate request-scoped identity, but contains no credentials, so it is not evidence of a cross-user data leak.

**Next step:** use deliberate initialization compatible with the host's suspension/lifetime model and explicit disposal for actual resources. Validate server isolation when identity is introduced.

### 8. P3 — Naming/import repairs are partial, and the enforcement gate remains a sketch

The coordinated static inventory found 208 TS/TSX files, 11 manifests, and 549 import/re-export specifiers, including 96 relative code-specifier occurrences. This is a source scan, not a TypeScript resolver or dependency-graph proof. Representative leftovers include [SDK provider](packages/client-sdk/src/react/provider.tsx#L4) and [notes workspace wiring](packages/features/src/notes/workspace/react/index.tsx#L4). Some multi-primary modules remain: [task details](packages/features/src/tasks/react/details.tsx#L10), [composer inputs](packages/features/src/notes/composer/input.tsx#L6), and [Electron route compositions](packages/features/src/app/electron/routes.tsx#L8).

The [boundary policy](tooling/boundaries/policy.json#L2) explicitly says it is unenforced. [Next config](apps/web/next.config.ts#L3) records barrel optimization but no compiler enablement, and [web scripts](apps/web/package.json#L5) only echo the mock status. There is no represented compiler-diagnostic, build/startup budget, packed-consumer, or architectural acceptance run.

**Attribution:** current stylistic preferences are only partially applied; verification is explicitly out of mock scope. Do not turn 96 relative imports into 96 correctness bugs or call the config a proven bundle regression. The enforcement reference itself labels much of its tooling as implementation backlog.

**Next step:** after the core contract fixes, apply naming/import rules consistently and create one executable vertical-slice gate. More files or copied CI names will not prove compliance.

## RCA: model errors versus skill limitations

The observed pattern is **good reproduction of visible consumption syntax, weak implementation of the mechanism that makes it trustworthy**. The repair clearly addresses local feedback—metadata placement, flat IDs, page names, error notices—while leaving the catalog propagation and behavioral acceptance question unresolved. That is an inference from source, not a claim about Grok's internal reasoning or which prompt it saw.

Three distinctions prevent unfair attribution:

1. **Clear instructions, incomplete implementation:** no handwritten method mirrors/keys; validated error ownership; controller eligibility; publishable dependency declarations; DS parity. These do not need new stylistic rules. They need a working adapter and targeted acceptance checks.
2. **Skill supplies proposed interfaces, not implementations:** the client-SDK reference expressly calls `createQuery` and the type helpers proposed APIs, with adapter work still pending. That is a real gap in the ambition to generate an opinionated starter from the skill alone. A model should disclose or implement that missing work, rather than substitute a second catalog and call it derived. A verified reusable generic adapter would be more valuable than another instruction paragraph.
3. **Some defects can be seeded by examples:** [Prefetch](packages/client-sdk/src/rsc/prefetch.tsx#L26) copies the current platform example's `Promise.resolve(prepare(...)).catch(...)` shape. If a permitted synchronous preparation callback throws before returning, that catch does not receive the exception. The supplied callbacks are async, so this is not a demonstrated current-page failure; it is an owned helper-contract edge case attributable to the example as well as the copy. Improve the reference and regression fixture together. Conversely, no direct conflicting example was found that authorizes the handwritten SDK catalogs.

Do not overcorrect valid patterns: core schema-only imports are allowed; intentional explicit mock failures are good; feature-local host adapters are intended; provider/Suspense wrappers can own real boundaries; and broad [mutation invalidation](packages/client-sdk/src/features/notes/react/mutation-defaults.ts#L10) matches the reference's operation-prefix policy. Absence of `exact: true` there is not itself a violation—`exact: true` is required when the intended target is one full input/scope key.

## Comparison with review 1

Against its recorded observations, the revised source demonstrates meaningful improvement: independent notes/tasks Next pages; useful wrapper preservation; generic prefetch moved to SDK/RSC; correct `query-provider` naming; data-first refresh notices; globally distinct error tags; creation navigation wired in host adapters; scalar ID typing; flat detail props; draft `patch/replace/reset`; lifecycle/eligibility/ref metadata; and portable resolved-ID composition separated from route reading.

The repair is less complete than its mapping table implies. Internal imports and multiple primary components remain inconsistent; error-code declarations are stronger than their SDK handling; helper names exist without the required inference guarantees; and the claim of a derived query surface is contradicted by the handwritten catalogs. There is no defensible numeric “improvement delta” without an equivalent earlier rubric/source snapshot.

## Validation limits and prioritized next pass

Performed: broad read-only source inspection, line-level cross-checks, manifest inspection, searches for state consumers and wiring, reference/example comparison, and the coordinated static import/file inventory. No installs, dependency execution, builds, compiler checks, API calls, browser/native/Electron runs, bundle measurements, or published-package smoke tests were performed. No implementation or skill files were modified by this review. The only grader-authored artifact is this report.

The next pass should be a small verified slice, in this order:

1. Derive client/query/key metadata from the API; retain an explicit fake transport. Prove adding an operation needs no second catalog edit.
2. Preserve and validate error/type metadata, including `getOptions` helper parity and negative type fixtures.
3. Test composer identity and legal actions with a deterministic successful/erroring data source; wire selection to an actual result.
4. Declare/package dependencies and exercise public SDK consumption plus web/native DS capability parity.
5. Then enforce imports/file roles, enable real compiler diagnostics, and set measured build/startup/bundle gates for whichever host is made runnable.

The app follows many of the skill's architectural shapes well. It does **not** yet follow the central “one definition, derived consumers, verified substitution” requirement well enough to serve as the reusable starter the skill describes.
