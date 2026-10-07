# Build one complete vertical slice

Use this sequence when building a new product or adding/changing a feature that crosses the API boundary. It specifies dependency order and completion evidence. It does not require a new package, database table, provider, or client for every feature.

**Design from the consumer inward; implement from core outward; verify through the user interaction.** The desired SDK call and component tree are contracts to satisfy, not permission to implement product behavior in UI first and extract it later.

## Select the slice before writing implementation

Choose one concrete user outcome: for example, rename a workspace and see the new name in its header and list. Include authorization, invalid input, a failed request, and retained user edits where they affect that outcome. Identify reads, mutations, streams, and lifecycle events deliberately; do not derive operation kind or retry safety from a method name.

Write the intended public SDK consumption and UI composition. Map each boundary to its existing owner and mark it **reuse**, **change**, or **not applicable**, with a short reason when needed. This can be a short implementation note, not a separate planning artifact. Inspect actual code/exports; a directory with the right name is not a working integration.

For React work, read the relevant composition rules and [state contract](ui-states.md). Agree the input/output/error/event contracts, provider ownership, and substantial UI states before independent agents implement consumers. If an outcome reveals a missing contract, revise it at its owning API/schema and propagate the derivation.

## Implementation order and handoff evidence

| Stage | Work at the owner | Evidence before dependent integration |
| --- | --- | --- |
| 1. Core declarations | Define runtime input, result, error, and event schemas in `core/features/<feature>/api/schema.ts`; declare operations in `api/rpc.ts`. Derive static types. Specify authorization, cancellation, and replay/idempotency semantics relevant to the operation. | Representative valid/invalid inputs and legal outcomes are explicit; downstream contracts refer to these definitions. |
| 2. Core implementation | Implement owned dependency/execution adapters and persistence only when needed. Implement the named feature service against those capabilities; keep host credentials and privileged execution at their authorized owner. | Relevant success, denial, validation, failure, and lifecycle behavior has been exercised with explicit real/test capabilities. No fake production-success fallback. |
| 3. API binding and mounting | Bind authorized services in feature `api/index.ts`, compose the API, and use its existing host adapter/mount. Wire declaration and server handler binding have different responsibilities even though both live in the API area. | An API-boundary consumer reaches the real service, validates inputs/results, and receives declared failures. Direct service tests alone do not prove mounting. |
| 4. Inferred RPC and vanilla SDK | Let the generic binding derive the operation. Add feature-local semantic helpers/controllers for interpretation, sequencing, retries, recovery, and protocol assembly when the wire operation alone is insufficient. Export the complete public capability. | A public non-React consumer performs this slice's operation/lifecycle without copied UI logic or private imports. API edits propagate without a handwritten RPC catalog. |
| 5. React data integration | Derive Query options/keys from that operation; put mutation invalidation/reconciliation in the central SDK policy. Bind long-lived SDK controllers through an owned subscription adapter. Reuse stable client/cache setup. | Public React consumers compile and execute the relevant Query/cache or subscription behavior. Required failures, cancellation, and scope/lifetime behavior are covered. An exported name alone does not pass. |
| 6. Feature composition | Thin feature hooks consume SDK React capabilities. Providers own independent subscriptions. State readers dispatch exhaustively and compose resolved content and shared DS pending/error/empty parts. | Components work through the declared contract; no feature effects, raw transport, or missing product logic has appeared. State/schema/type checks and composition checks cover relevant outcomes. |
| 7. Host composition and real flow | Mount the feature's public platform entry point from the app. Inject navigation, identity, persistence, transport, and other host choices at their owning integration boundary. Reuse the app's shared client/cache lifetime. | The actual user interaction traverses the real mounted path and updates the visible result. Exercise failure/recovery and refresh/reconnect where applicable; record inaccessible paths. |

Declarations come before persistence/service consumers; **handler binding** follows the service implementation. “API first” does not mean implementing handlers before their dependencies, and “core outward” does not mean designing the public interface without considering its consumer.

Check each changed boundary while implementing it. A failed contract/type/integration check goes back to its owner; downstream code must not compensate with duplicate schemas, casts, manual fetch effects, or alternate client methods. Unchanged stages need existing implementation evidence, not redundant rewrites or rerunning unrelated suites.

## How the flow connects

For the workspace rename example, the mutation travels through:

```text
DS submit interaction
  → feature action/mutation hook
  → SDK-derived mutation options
  → inferred RPC transport
  → mounted API authorization/validation
  → workspace service
  → owned persistence capability, if needed
```

The result returns through the same contract:

```text
schema-defined result or typed failure
  → RPC decoding and SDK interpretation
  → Query mutation result + centralized cache policy
  → workspace detail/list observers
  → provider/feature state readers
  → DS success content or inline recovery presentation
```

The feature does not invent a cache key, copy the workspace into another fetched-state owner, or parse an error message to decide what happened. A failed rename retains the editable draft; success updates the affected views through the declared cache policy. The server remains authoritative for authorization regardless of UI eligibility.

Initial reads use the same public query options through the feature hook. For a live connection, the SDK controller owns connection/reconnect policy; its React adapter publishes snapshots to the feature. Query may acquire request data but must not silently replay side-effecting commands on focus/reconnect. Browser/DOM events enter through a registered host adapter, never through product protocol parsing in the DS.

This trace is an ownership example, not a requirement to introduce workspaces or these exact file/function names in every product.

## Greenfield and existing products

**Greenfield:** establish the minimum source roles, schema/runtime dependency ownership, API host, inferred RPC/SDK, Query setup, DS primitives, and verification tooling needed by the first outcome. Then complete that outcome across all applicable stages. Do not build all core features first and postpone consumption until the end; the first slice must expose integration mistakes before the architecture spreads.

**A new feature in an existing product:** inspect and reuse the established API composition, generic RPC/Query derivation, SDK lifetime, DS parts, and platform entry points. Locate the existing app QueryClient factory and provider mount before writing feature code; adding a feature adds neither a cache nor a QueryClientProvider. Separate feature context providers consume the same cache. Add the feature's own declarations/service/semantics and deliberate public exports. Missing shared infrastructure is repaired at its owner, not recreated inside the feature.

**A narrower change:** start at the lowest owner whose contract/behavior changes, then follow its affected consumers outward. A new UI presentation can consume an unchanged verified SDK. A service bug may leave every public contract untouched. Explain non-applicable stages briefly; do not manufacture a migration, endpoint, or provider to complete a checklist.

## Parallel work without skipping dependencies

After contracts and ownership are agreed, independent service/adapters, DS primitives, and pure state presentations can proceed concurrently. Mock providers must implement the same contract and remain visibly test/development-only. SDK/Query plumbing can be developed against declarations, but its acceptance must run against the real mounted implementation before the slice is complete.

Name file ownership and public handoff contracts when delegating. One owner coordinates shared schema/API changes, dependency installs, and shared integration files. A UI agent does not invent fetching because another agent has not delivered the SDK; it develops the agreed presentation or returns the missing capability to its owner. Follow the repository's delegation and verification policy.

Do not call a mock-rendered screen, a working endpoint, or a compiling package “the feature is complete.” Final acceptance needs both [architecture evidence](enforcement.md#query-and-sdk-acceptance-fixtures) and the requested real user flow. If credentials/services block the latter, state the exact unverified edge and keep the limitation explicit.
