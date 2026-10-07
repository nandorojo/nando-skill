# Query contracts without eager result normalization

React products with server reads/mutations must use the API-derived SDK React Query binding. Its optional framework peer preserves vanilla SDK consumption; it does not make this architecture optional for React server state. Do not replace it with effect-driven promises and copied loading/error state. Long-lived streams use an owned SDK subscription adapter with reusable lifecycle policy in the vanilla controller.

## Preserve tracking at the hook boundary

The default feature hook returns React Query's result object unchanged, with a narrowed public **type**. Do not eagerly call `normalizeUserResource(result)` over every result. Reading properties during normalization subscribes the hook's observer to those properties even if the eventual view does not use them. Spreading/rest-destructuring the result touches the full surface. Structural sharing of `data` is a separate optimization from result-property tracking. [TanStack render optimizations](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations).

```ts
// Rejected as the universal hook boundary: eagerly reads four properties.
const { data, error, status, fetchStatus } = result
return { data, error, status, fetchStatus }
```

An explicit view that renders fetch status should read it. The mistake is reading it in a generic wrapper on behalf of every consumer. `useMemo` around that wrapper does not undo those reads or repair its subscription scope. Keep legal-state derivation where that state is actually needed, with an explicit cost and contract.

### One owned type projection, no runtime mapper

```ts
// libraries/query/react/resource.ts — owned vendor adapter
import type {
  DefaultError,
  UseQueryResult,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'

type ResourceFields<T> = T extends unknown
  ? Pick<T, Extract<keyof T, 'data' | 'error' | 'status' | 'fetchStatus'>>
  : never

export type QueryResource<TData, TError = DefaultError> =
  ResourceFields<UseQueryResult<TData, TError>>

export type SuspenseQueryResource<TData, TError = DefaultError> =
  ResourceFields<UseSuspenseQueryResult<TData, TError>>
```

The conditional type distributes over the result union, preserving the relationship between status and data/error. A plain `Pick` over the whole union can lose that narrowing. This deliberately adopts a small part of Query's state vocabulary; it is an owned foundational facade, not a universal transport-independent state machine. A future implementation must satisfy that vocabulary or introduce an explicit contract revision. No API DTO is redefined.

```ts
// features/src/users/react/use-user-by-id.ts
import type { InputOf } from '@example/client-sdk'
import { useQueryApi } from '@example/client-sdk/react'
import type { Query, ResourceOf } from '@example/client-sdk/react'
import { useQuery } from '@example/libraries/query/react'

type UserRead = Query['users']['byId']

export function useUserById(input: InputOf<UserRead>): ResourceOf<UserRead> {
  const query = useQueryApi()
  return useQuery(query.users.byId.getOptions(input))
}
```

Where an actual `query` is already in scope, the equivalent spelling is `InputOf<typeof query.users.byId>` and `ResourceOf<typeof query.users.byId>`. The [SDK helper contract](client-sdk.md#derive-types-from-the-operation-in-front-of-you) also supports its `getOptions` factory. `ResourceOf` derives data/error from the operation and applies the generic projection above; consumers do not write the generic plumbing themselves. No `UserInput`/`UserResource` alias or contract file is required solely for this hook.

There is no allocation, spread, getter wrapper, cast, or property read in the return boundary. The return annotation limits what callers can use; it does not remove properties at runtime or act as a security boundary. This is the intended exception to banning the entire vendor observer as a public feature contract. Add only needed fields through the owned facade; do not expose every vendor method to avoid designing actions.

Expected errors must carry the schema-defined globally unique code and typed payload described in [backend failures](contracts-backend.md#typed-failures-and-globally-unique-codes). Feature UI exhaustively handles that union; SDK-owned transport/unexpected-failure variants remain distinguishable.

Expected error typing must match the SDK/query adapter's real error behavior. Promise rejection types are not inferred by TypeScript; the default Query error type alone does not prove all thrown values conform. Keep runtime error normalization in the SDK boundary, separately from query-result normalization.

For data-only consumers, retain the stable `data` reference. When a view needs a subset or projection of data, consider the query's `select` option with an owned stable selector; do not transform/clone the entire query result. Product interpretation still belongs in SDK helpers. Do not default `notifyOnChangeProps` to `all`. Use TanStack's no-rest-destructuring lint and review helper/spread usage. [Tracking and select](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations).

## Data availability precedes request status

A query view checks for usable `data` first. Render retained data throughout background refetch and render any error alongside it through the shared inline error presentation. Only the no-data branch chooses initial error, loading, paused, or not-requested UI. `status === 'error'` does not by itself mean there is no data; `fetchStatus === 'fetching'` does not by itself justify replacing the content with a skeleton. Successful empty data is still data.

For paginated/infinite reads, expose the specific fields/actions the consumer needs through an owned infinite-resource type projection (for example next-page activity and failure versus background refetch). The four-field single-query projection above cannot express all pagination states. Preserve the native observer at runtime; do not infer “loading more” from generic `fetchStatus` or widen every ordinary query hook. Keep loaded rows visible and place additional-page feedback/retry at the list continuation. See [UI states](ui-states.md) for composition and acceptance cases.

## Mutation hooks return the native result

React Query is an intentional core primitive of our React layer. A feature mutation hook returns the `useMutation` result directly, with its inferred return type. Do not rename `mutateAsync` to a domain verb and reconstruct selected status/error fields solely to hide the dependency. The feature hook remains the owner of operation selection and a useful migration boundary, but consumers knowingly depend on the Query mutation contract.

```ts
// features/src/users/react/use-update-user.ts
import { useQueryApi } from '@example/client-sdk/react'
import { useMutation } from '@example/libraries/query/react'

export function useUpdateUser() {
  const query = useQueryApi()
  return useMutation(query.users.update.mutationOptions())
}
```

```tsx
// Consumer retains the relationship between status, result, and failure.
export function UpdateUserStatus() {
  const mutation = useUpdateUser()
  switch (mutation.status) {
    case 'idle': return <UpdateReady />
    case 'pending': return <UpdatePending />
    case 'error': return <UpdateError error={mutation.error} />
    case 'success': return <UpdatedUser user={mutation.data} />
  }
}
```

This illustrative component owns a mutation instance; mount the mutation in a provider when sibling controls and status parts must share the same instance. Separate calls to `useUpdateUser` do not share mutation-observer state just because their mutation key matches. Types come from the API-derived options; use `ReturnType<typeof useUpdateUser>` when a consumer needs the whole result type, without repeating data/error/variables generics or defining a second state schema. Actual success-data guarantees depend on the endpoint schema (a void-returning operation still returns void).

**Rendering distinction:** inspected `@tanstack/react-query@5.101.4` subscribes `useMutation` through `useSyncExternalStore` to mutation observer results; it does not use `QueryObserver.trackResult`'s property-read tracking. Returning the native result preserves its union/API and avoids our extra projection; it does not promise query-style selective notifications, stable result-object identity, or no rerenders when only `mutate` is read. Recheck the pinned version before making performance claims. [Mutation hook source](https://github.com/TanStack/query/blob/main/packages/react-query/src/useMutation.ts), [render optimizations](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations).

Migration away from React Query may require retaining this contract through an adapter or changing React consumers. That is an accepted tradeoff; do not pay for a weaker custom facade now solely to claim effortless replacement later. Changing HTTP to WebSocket can still happen below the same Query mutation/query functions. Domain workflows such as a composer may expose their own meaningful `state/actions` contract, but ordinary mutations need no mandatory normalization layer.

Owned imports and centralized `setMutationDefaults(client)` remain required. Returning the full result does not authorize per-hook lifecycle overrides that bypass product invalidation. Keep the current type-only query-resource projection for query hooks; this explicit mutation decision does not silently widen every other dependency boundary.

## Providers and explicit state machines

A provider may own the hook for a shared lifetime. However, tracked fields belong to that query observer, not independently to every context consumer. Ordinary React context does not turn the result into per-field selector subscriptions. Context value updates can rerender all consumers; do not promise that a narrowed type fixes context fan-out. Measure the actual provider/consumer tree, and split ownership or use an owned selector-store adapter when needed.

A headless composer or workflow can still expose a domain-specific `state/actions` contract. Such an implementer intentionally reads and derives the fields it needs. Likewise, the pure list-state fixture remains valid as a state-model example; it does not justify running a generic eager normalizer in every data hook. Keep initial absence, successful empty data, and stale data with refresh errors distinct whichever representation is chosen.

## Suspense is an explicit alternative

Non-suspending hooks remain the default preference. For TanStack Query v5, use `useSuspenseQuery` (or its infinite/multiple-query counterpart), not `useQuery({ suspense: true })`. Give a suspending feature hook a distinct name and documented boundary requirement; do not select different hooks conditionally behind a boolean. Successful return guarantees defined data, but background refetch errors can coexist with retained data. [TanStack Suspense guide](https://tanstack.com/query/latest/docs/framework/react/guides/suspense).

```ts
// features/src/users/react/use-suspense-user-by-id.ts
import type { InputOf } from '@example/client-sdk'
import { useQueryApi } from '@example/client-sdk/react'
import type { Query, SuspenseResourceOf } from '@example/client-sdk/react'
import { useSuspenseQuery } from '@example/libraries/query/react'

type UserRead = Query['users']['byId']

export function useSuspenseUserById(
  input: InputOf<UserRead>,
): SuspenseResourceOf<UserRead> {
  const query = useQueryApi()
  return useSuspenseQuery(query.users.byId.getOptions(input))
}
```

The inferred options adapter must produce options accepted by this installed hook: resolved input and a callable query function, without `skipToken`, conditional `enabled`, or placeholder-data semantics. Validate the integration rather than casting incompatible options. Suspense requests can introduce waterfalls; use the installed multiple-query API or existing prefetch orchestration for independent reads. [Suspense behavior](https://tanstack.com/query/latest/docs/framework/react/guides/suspense).

```tsx
// Owned feature composition: the boundaries are above the suspending reader.
<UserQueryErrorBoundary>
  <Suspense fallback={<UserPending />}>
    <SuspenseUserDetails id={userId} />
  </Suspense>
</UserQueryErrorBoundary>
```

`UserQueryErrorBoundary` is a proposed owned integration that wires an actual error boundary to Query's reset boundary and presents retry UI. `Suspense` alone handles pending work, not errors. Putting this boundary inside `SuspenseUserDetails` after it calls the suspending hook would be too late. Retain the installed version's documented error policy rather than assuming every background error throws.

Do not promise identical cancellation semantics between normal and Suspense queries; the current `useSuspenseQuery` reference documents a cancellation limitation. Verify it against the product's requirements. Optional RSC prefetch remains a separate optimization, not a requirement that all feature hooks suspend. [useSuspenseQuery reference](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery).

## Acceptance before adopting the facade

- Verify tracked notifications for data-only, status-reading, eager-normalized, and spread-result consumers using the pinned Query version.
- Typecheck success/data narrowing and rejection of undeclared observer fields; test inference through the real generated query-options adapter.
- Mount direct-hook and provider-owned consumers with the selected React Compiler configuration; observe rerenders during same-data background refetch and actual data changes.
- Verify pending/error/reset handling for both hook variants, defined Suspense data, initial offline behavior, key changes, stale-data errors, and cancellation differences.

The query return boundary is intentionally small; mutation hooks deliberately retain the full native result. A new generic proxy, subscription store, or mandatory normalized union is not required to write a feature hook.

## Submission lists and message-owned retry

Use `useMutationState` when a view needs all matching submissions, including ones started by another component. Scope the selection by the generated mutation key and resource identity; an operation-wide pending check should not block unrelated conversations. Keep variables, status, and errors in Query's mutation cache. The SDK React adapter can expose a typed per-submission `retry()` capability; validate heterogeneous cache entries at that boundary rather than casting them in a feature.

For an optimistic chat composer, pending and failed variables remain visible beside the message after the input clears. Retry acts on that submission independently of the composer and respects server idempotency semantics through a vanilla SDK helper. Ensure failure retention lasts as long as the promised retry UI, avoid duplicate optimistic/committed rows, and do not keep a second local submission array synchronized with Query. A retry must not run composer-clearing callbacks against a newer draft.

Verify failed send → edit a new draft → retry the old message, multiple retained failures, cross-session isolation, and pending → committed reconciliation. Keep query and composer observers in separate provider implementations. A query resource may expose a needed native action such as `refetch` through its type-only projection without cloning the observer.
