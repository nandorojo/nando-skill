# Derive clients; add only product meaning

The primary success criterion is that an independent client can reproduce the product from its documented public API and protocols. The SDK makes that consumption convenient, adding only justified behavior that must run locally. Missing server behavior belongs behind an API operation; missing necessary client helpers belong here, never in copied app internals. Swift, CLI, MCP, browser, and native clients are all legitimate consumers; none should have to reverse-engineer this SDK to discover domain rules. Keep one coherent root interface with feature-local implementation. See [runtimes](runtimes.md) for coding-agent and local/sandbox examples.

Evolve the SDK at its public boundary. Add an operation at its API owner; derive its internal methods and publish regenerated external clients when applicable. Check incompatible schema/error/event changes and version affected published surfaces deliberately. Add only real semantic extensions; do not copy the operation catalog into a new facade. Measure consumer inference/IDE speed as the API grows, as well as runtime startup, bundle cost, and streaming overhead.

## Internal RPC and external SDK are different consumption paths

`@example/rpc` derives the internal transport client directly from the composed API; normal product consumers receive it through the complete root client SDK. No TypeScript codegen, manually repeated client method interface, or per-feature `createService`/`createQueries` is part of this path. The RPC package owns protocol/runtime binding once and exposes inferred methods to browser, native, server, and other internal TypeScript callers.

The external SDK can be generated from the derived OpenAPI document. That distribution is useful for external consumers/languages; internal TypeScript clients do not pass through it to recover types already available from the API.

The client SDK adapts documented API meaning to necessary local consumption: stream assembly, local connection sequencing/recovery/cancellation, display helpers, and framework-specific resource adapters. Authoritative ordering and domain semantics originate in the API; a client helper may apply documented presentation ordering locally when needed. When a result needs no semantic adaptation, the root client exposes the inferred operation directly through the generic binding, without a per-method pass-through implementation.

Server-capable orchestration belongs in backend operations, not this SDK. Do not implement dependent query/mutation waterfalls here merely to hide them from React. Connection sequencing below means necessarily local attachment/transport behavior; the server owns dependent fetches, startup prerequisites, and domain decisions. See [server-owned orchestration](contracts-backend.md#server-owned-orchestration-and-safe-queries).

## Justify handwritten SDK behavior

Before adding a helper, controller, store, or abstraction, identify its concrete consumer and observable behavior. First ask whether the owning API can return the needed result or execute the workflow. If so, implement it there. Next ask whether the inferred operation, existing Query lifecycle, transport library, or host adapter already owns the behavior. Reuse that owner instead of layering another state machine around it.

Keep a handwritten SDK addition only when it owns a necessary local responsibility, such as assembling streamed snapshots, cancelling a local attachment, or interpreting a documented connection protocol. Explain why it must run on the client, which state it uniquely owns, and how a consumer uses it. Prefer a pure helper or existing primitive when sufficient; N possible clients does not justify speculative controllers or configuration. UI helper functions are legitimate, but domain invariants and authoritative transitions remain server-owned. SDK display helpers interpret API-defined meaning rather than inventing hidden product rules.

For example, ensuring a workspace exists and authorizing or renewing access belong behind explicit API operations. Observing a local connection, releasing local listeners, and rejecting late events from a replaced attachment can require client code. Browser frame mechanics belong in the host adapter. Document any public connection protocol, including readiness, expiry, revisions, and failure semantics, so another language can implement it without reading TypeScript internals. Do not add these mechanisms to products that do not need them.

Choose Effect based on the remaining responsibility. If necessary local work has interdependent cancellation, resource cleanup, concurrency, and retry lifetimes, evaluate whether the existing owned Effect runtime expresses them more simply than manual timers and flags. Compare against a smaller implementation using existing transport/Query primitives, accounting for bundle/runtime cost and the public consumption contract. Using Effect does not justify unnecessary behavior or repair misplaced ownership; do not mandate an Effect rewrite for every helper or controller.

Acceptance has two separate parts: demonstrate the relevant product outcome through the public API/protocol without app internals or hidden SDK domain decisions, and demonstrate the necessary local behavior through the public SDK. For a narrow change, scope these checks to the affected capability; do not build a speculative second app. Count neither file placement nor a large controller as evidence of completeness.

## One complete client at the package root

Apps supply typed host configuration; the SDK resolves reusable defaults at its public factory boundary. See [configuration ownership](configuration.md) for env parsing, URL/path constants, and fallbacks. In the example below, `config` is the app's validated configuration.

The default public consumption is one API SDK client (called the “product client” in older examples). It performs typed backend operations; it is not TanStack QueryClient, which owns the query/mutation cache and request lifecycle. Prefer `sdkClient` and `queryClient` when both are in scope. This terminology does not require a new `ProductClient` class or provider wrapper:


```ts
import { createClient } from '@example/client-sdk'

const client = createClient({ baseUrl: config.apiBaseUrl })
const user = await client.users.byId({ id })
```

`createClient` is the proposed root factory; `new Client` would be an equivalent public design, but pick one instead of providing redundant styles. It exposes the complete inferred operation surface with client-owned semantic adaptations where required. Configure transport/auth/runtime once per app or request lifetime. Do not reconstruct it in every render. The implementation must own acquisition, cancellation, and an explicit disposal contract for scoped resources. Exporting every RPC method is not a complete SDK when a feature still owns sequencing, retry/backoff, recovery, cancellation policy, protocol assembly, or typed product-error interpretation. Demonstrate these behaviors through a public vanilla consumer: a fixture that only calls endpoints cannot establish completeness. For a product with reconnect behavior, exercise interruption, recovery, cancellation/disposal, and unintended replay prevention through that same SDK.

This root factory is useful instance construction. The earlier ban concerns per-domain factories that manually repeat API methods. A returned runtime client instance can have methods; ESM export rules apply to how the package publishes the factory and modules, not to banning objects at runtime.

### SDK initialization is independent of Query hydration

`ClientSDKProvider` injects the API SDK and its derived operation helpers. `QueryClientProvider` supplies TanStack's cache and request lifecycle. Name their values `sdkClient` and `queryClient`; do not add a forwarding `ProductClientProvider` around the SDK provider. This is the preferred name for new integrations; an existing public export needs a deliberate migration rather than a silent breaking rename.

Query's Next setup isolates server caches and retains the browser cache across initial Suspense retries. Optional dehydration/hydration transfers query state, not the SDK instance, transport, or methods. `environmentManager.isServer()` detects the environment; it does not hydrate anything. Keep that version-specific setup in the Query adapter. The SDK's vanilla construction must not import Query/React to imitate it.

Choose SDK initialization from its actual implementation:

- A stateless, environment-safe API client with no captured request credentials, mutable per-user state, or owned resources can be shared with stable configuration. Do not add server/browser branching or disposal machinery merely because Query uses them.
- A client capturing request credentials or mutable per-request state needs request isolation. Resolve server URL/auth configuration at the host boundary; a browser-relative URL is not automatically a valid server transport.
- A client owning an Effect scope, socket, worker, or other resource needs a defined acquisition and cleanup owner. Do not acquire unmanaged resources on each render or suspense retry. A disposable API client is not stateless just because it has no query cache.

Browser identity changes and server calls may require different configuration, but demonstrate that requirement rather than assuming identical SDK and Query lifetimes. Keep app-specific initialization in app bootstrap and reusable SDK mechanics in the SDK. No general environment-manager abstraction or additional provider is required for this decision.

### Optional rendering integrations have explicit owners

The vanilla SDK root remains usable without a rendering framework. “Optional” describes whether a consumer uses React; it does not let a React product with server state omit the derived React Query integration. Implement that binding before building its request-consuming features. Streams and long-lived connections use owned subscription adapters rather than being forced into Query. `client-sdk/react` owns the product query binding and client hooks/providers; `client-sdk/rsc` may own reusable server-only prefetch/hydration orchestration over that inferred binding. RSC helpers take scoped client/query capabilities from their host integration rather than importing feature modules, Next cookies/headers, or app configuration. Keep them out of client-only barrels and expose an explicit server entry point. Generic vendor hydration primitives stay in the owned Query library. See [platform ownership](platforms.md#portable-features-and-colocated-host-adapters).

Feature-specific navigation and page composition remain beside the feature's explicit host adapter. SDK adapters provide product consumption capabilities; they do not render note screens or implement routes. The app mounts shared integration in its root bootstrap, such as `apps/web/app/providers.tsx`. Feature adapters do not own the app root layout or client lifetimes; packages never import app bootstrap.

### One React entry point, optional for vanilla consumers

```tsx
import { createQuery, ClientSDKProvider, useQueryApi } from '@example/client-sdk/react'

// At the composition root; client is the stable root SDK instance.
const query = createQuery(client)
query.users.byId.getOptions({ id })
```

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

Prefer the query-shaped name to distinguish the options interface from the plain client. `getOptions` is the proposed owned spelling of a query option factory; it can internally use TanStack `queryOptions`. Inputs/results are inferred, and imperative prefetch consumes the same options. Mutation factories follow declared operation policy, for example `query.chat.sendMessage.mutationOptions()`.

`ClientSDKProvider` takes the stable client and makes its derived query interface available through `useQueryApi`; implementations can memoize the generic derivation once. Mount it with the shared app QueryClientProvider at the application composition root according to the official framework guide; these are distinct responsibilities, not per-feature infrastructure. Feature hooks/providers consume the existing instances and never manufacture another Query cache. `createQuery` is pure integration code usable by RSC; client-only provider/hooks keep `use client` on their leaf modules rather than marking the entire public barrel client-only.

These are **proposed owned SDK APIs**, not APIs shipped by Effect/TanStack and not implemented in this kit. They establish the consumption target for the generic adapter once.

The React feature owns a small hook around this query usage and exposes an intentional resource/state/actions contract to components. A data hook can return the unchanged tracked query result with a narrow public type; do not require an eager normalizer. See [tracked resource and Suspense contracts](query-resources.md). That hook consumes the owned integration when a data source changes; generic API-derived options remain available for both the hook and server prefetch. Put reusable product logic in the vanilla client SDK, not inside the hook. If a hook itself becomes shared SDK functionality, colocate it with that SDK feature and export it through `./react`; do not maintain a second feature implementation. See [hook ownership and optional providers](react.md#components-consume-hooks-hooks-adapt-the-sdk).

## Derive types from the operation in front of you

The SDK must expose ergonomic type helpers. Consumers should be able to point at an already inferred operation and obtain its types immediately. Do not make them navigate back to a schema file or repeat `Parameters<...>[0]`, `Awaited<ReturnType<...>>`, and query-result generics for every feature.

```ts
import type { InputOf, OutputOf } from '@example/client-sdk'
import { createQuery } from '@example/client-sdk/react'
import type { ResourceOf, SuspenseResourceOf } from '@example/client-sdk/react'

// client is the existing instance owned by this composition root.
const query = createQuery(client)

type UserInput = InputOf<typeof query.users.byId>
type UserOutput = OutputOf<typeof query.users.byId>
type UserResource = ResourceOf<typeof query.users.byId>
type SuspenseUserResource = SuspenseResourceOf<typeof query.users.byId>

// The option factory is another view of that same operation.
type SameInput = InputOf<typeof query.users.byId.getOptions>
type SameResource = ResourceOf<typeof query.users.byId.getOptions>
```

These aliases illustrate the API; callers can use the helper inline. Do not require a `UserInput`/`UserResource` declaration or a new `contract.ts` file merely to rename something that is already derived. A feature contract file remains useful when it defines actual state/actions or a meaningful shared composition boundary.

| Helper | Meaning | Public home |
| --- | --- | --- |
| `InputOf<T>` | Caller payload accepted by an inferred operation or its options factory; excludes separate transport/request configuration | Vanilla client SDK root |
| `OutputOf<T>` | Successful consumer data from that operation; includes SDK semantic adaptation, not the options object returned by `getOptions` | Vanilla client SDK root |
| `ResourceOf<T>` | Narrow non-Suspense query resource for that query operation's data and declared adapter error type | `client-sdk/react` |
| `SuspenseResourceOf<T>` | Corresponding defined-data resource for the explicit Suspense query variant | `client-sdk/react` |

Input/output helpers also work on the corresponding inferred root client operation, for example `InputOf<typeof client.users.byId>`. `InputOf` can extract the first argument of an ordinary owned function/hook too: `InputOf<typeof useUserById>` derives a component prop from the feature hook instead of restating its payload. For API operations, preserved metadata disambiguates no-payload methods whose only argument is request configuration. Do not deduce a query's output by blindly taking `ReturnType` of `getOptions`: that yields options, not data. Extract the operation's preserved type information once in the generic adapter. Root helpers contain no React dependency; only the resource helpers depend on the owned React/query type projection.

### A feature hook needs no runtime singleton for its types

```ts
// client-sdk/react public type; derived from the real factory's signature.
export type Query = ReturnType<typeof createQuery>
```

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

Where a real `query` is already in scope, prefer `typeof query.users.byId`. Where it is not, the factory-derived `Query` type gives the same operation type without constructing a client, calling a hook for types, or inventing a global query instance. Do not reference a hook-local variable from the hook's parameter/return annotation, where it is out of scope. `Query` is the configured product's inferred surface, not a handwritten operation catalog.

### Implement the helpers once with the generic adapter

These helper exports are the required **proposed consumption API**, not currently implemented package exports. The RPC-to-query adapter must preserve the originating operation's input, semantic output, and normalized error type on both the operation and its options factory. If inference needs a type-only carrier, generate it in the adapter from the authoritative descriptor; never register those types again per endpoint. No runtime factory call, codegen step, or schema duplication is needed just to use a type helper.

`ResourceOf` uses the [owned result projection](query-resources.md#one-owned-type-projection-no-runtime-mapper). It changes only the public type; it must not read, copy, normalize, or proxy the runtime result. Preserve union discrimination and ordinary versus Suspense data availability. Do not infer caught Promise errors from a return signature; carry the SDK/adapter's actual normalized error contract from its owner.

Keep query, mutation, and streaming operation categories explicit. `ResourceOf` must reject an incompatible operation kind rather than invent a query result for a mutation or raw stream. Likewise, unsupported arguments to these helpers should be type errors, not silently become `any`. Preserve optional/no-input payloads; do not accidentally infer the request-options parameter as the product payload. If an adapter supports `select`, derive its selected resource from the actual selected options; the unselected operation helper still describes its default data.

Prove these properties with small type fixtures for operation versus `getOptions`, changed API fields, optional/no-input routes, declared errors, Suspense, and invalid operation kinds. Measure inference/IDE cost on a representative large API. Consumer convenience should not require costly repeated whole-API conditional expansion.

## Feature-first source, small public surface

```text
client-sdk/src/
  index.ts                 public root: createClient and consumer types
  client.ts                private implementation
  react/
    index.ts               public React barrel: createQuery, setMutationDefaults, provider, hooks
    query.ts               generic query integration
    provider.tsx           client-only leaf
  rsc/                     optional server-only integration
    index.ts               separate public RSC barrel
    prefetch.tsx           reusable product query prefetch boundary
  features/
    deployments/display.ts
    chat/stream.ts
    chat/react.ts          optional additional domain hook
    users/react.ts         only if a useful owned contract is needed
rpc/src/
  index.ts                 deliberate public transport/type barrel
  client.ts                private runtime binding
  types.ts                 type-only Api reference
```

Root and `./react` are the default client SDK entry points. Add `./rsc` when implementing optional server rendering; never re-export it from the root or client barrel. Feature-local source remains colocated even though consumers see one complete client. Add other export-map entries only for an actual different consumption/runtime requirement; do not expose `./features/*`, `./src/*`, or every implementation file.

```json
{
  "name": "@example/client-sdk",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./react": { "types": "./dist/react/index.d.ts", "import": "./dist/react/index.js" },
    "./rsc": { "types": "./dist/rsc/index.d.ts", "import": "./dist/rsc/index.js" }
  }
}
```

```ts
// client-sdk/src/index.ts
export { createClient } from '#client-sdk/client'
export type { Client, ClientOptions } from '#client-sdk/client'
export type { InputOf, OutputOf } from '#client-sdk/inference'

// client-sdk/src/react/index.ts
export { createQuery } from '#client-sdk/react/query'
export { setMutationDefaults } from '#client-sdk/react/mutation-defaults'
export { ClientSDKProvider, useQueryApi } from '#client-sdk/react/provider'
export type { Query } from '#client-sdk/react/query'
export type { ResourceOf, SuspenseResourceOf } from '#client-sdk/react/inference'
```

The manifest illustrates an SDK with the optional RSC integration implemented; omit that export when absent. `#client-sdk/*` is the package-private absolute import map configured as described in [boundaries](boundaries.md); it does not make those implementation files public.

The implementation's Client type derives from the inferred RPC plus deliberate semantic extensions; do not create a handwritten interface listing every API method. Named/star/namespace barrels publish owned public symbols, and package export maps plus resolved-import rules block bypasses. Root import must not pull React, Next, or server implementations.

## Automatic query helpers

Both input and output flow from the original operation schemas. This names the **proposed owned query adapter**, not a built-in Effect/TanStack function. Build/select the generic adapter once. It converts the inferred Effect RPC methods into query/mutation option factories, handles running Effects/Streams, and forwards cancellation through the selected runtime. It must not require a handwritten `createUserQueries`, query key, or method map for each endpoint.

Derive mechanics: operation identity, payload/result types, stable key structure, and invoking the bound RPC. Declare semantics once with their owner: operation category and retry/idempotency policy beside the API operation; cache invalidation/reconciliation and pagination policy beside the SDK feature integration unless already derived from API metadata. An input/output schema alone cannot infer those facts.

A stream operation is not automatically a normal query. The client SDK's feature-local stream adapter decides how it becomes assembled snapshots or a normalized React resource. Do not silently cache an unconsumed Effect Stream as query data.

Use the same options with the pinned TanStack version's imperative query/prefetch API and ordinary hooks. For Next mounting/hydration, follow [platforms](platforms.md) and the official guide. A page should specify which operation/input to prefetch, not reconstruct its client and cache architecture.

Keys include every data-determining input and a non-secret account/workspace scope. Credentials never appear in query keys. Auth transitions clear/replace caches deliberately; server QueryClients are request isolated. Retry/invalidation metadata follows the domain policy rather than generic guesses about names such as `get` or `send`.

## Keys belong to the inferred operation

There is no separate `operationKeys` API. Put key construction on the same inferred query operations that expose options. Use the actual TanStack options field **`queryKey`**, not an extra `.key` alias inside the options object.

| Expression | Meaning |
| --- | --- |
| `query.users.byId.key` | Stable operation prefix; no ID required; matches all inputs/scopes beneath that operation within the selected QueryClient |
| `query.users.byId.getOptions({ id }).queryKey` | Full key, derived from operation identity, bound non-secret cache scope, and all data-determining inputs |
| `query.users.update.key` | Mutation operation prefix for registering defaults; generated mutation options preserve it in their `mutationKey` |

```ts
// query is the existing createQuery(productClient) result in this scope.
// Broad: invalidate every cached byId input for this operation.
void client.invalidateQueries({ queryKey: query.users.byId.key })

// Narrow: invalidate just this exact input and bound scope.
void client.invalidateQueries({
  queryKey: query.users.byId.getOptions({ id }).queryKey,
  exact: true,
})
```

Both are derived at runtime by one generic adapter from API operation identity and the supplied inputs, without TypeScript codegen or endpoint-specific key factories. Obtaining options must not execute the request. Keep full-key serialization deterministic and include every value that changes the result; never put credentials in keys. Mutation variables are not automatically part of a mutation key: the key identifies the mutation/defaults family, while variables are passed when executing it.

TanStack invalidation uses partial matching by default, even if supplied with what the caller considers a full key. Specify `exact: true` when requiring exactly that cache entry. Broader filters are useful for lists with multiple pages/filters; the policy decides whether to invalidate a family or one input. [TanStack query matching](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation).

The adapter must prove that an operation's prefix matches its options keys, exact invalidation excludes other IDs/scopes, and mutation defaults match generated mutation keys. Do not add an ambiguous `.key(input?)` where omitting required input silently changes its meaning. A dedicated input-taking shortcut can be added only if it shares the same full-key implementation; `getOptions(input).queryKey` already gives the canonical full key.

## Typed mutation consumption

Design and compile the consumer call site before implementing an adapter. Queries and mutations deserve the same inference and discoverability. Derive transport-free `query` and `mutation` descriptors from the authoritative operation declarations; filter by declared operation kind, not name or HTTP verb. These are views of the existing declarations, never another endpoint registry.

```ts
import { query, mutation } from '@example/client-sdk/react'

mutation.sessions.send.setDefaults(queryClient, {
  retry: false,
  async onSuccess(session, input) {
    // Both callback arguments infer from sessions.send.
    const queryKey = query.sessions.get.getKey({ id: session.id })
    await queryClient.cancelQueries({ queryKey, exact: true })
    queryClient.setQueryData(queryKey, session)
  },
})

// The bound surface supplies the executable function and the same mutation key.
useMutation(boundQuery.sessions.send.mutationOptions())
```

`setDefaults` contextually types success, failure, variables, and optimistic context from the operation. It accepts lifecycle policy, not replacement operation keys/functions. `getKey(input)` validates input and carries output/error types for cache reads and writes; it uses the same key construction as bound query options. If the SDK binds a non-secret cache scope, obtain exact keys from that scoped descriptor rather than an unscoped singleton. No transport is constructed or request executed to register policy.

Use `mutation.sessions.send.key` when only the family key is needed. Avoid `mutation.post.sessions`: transport verbs do not add product meaning. Consumers should not need `operationKey('sessions.send' satisfies ApiOperationTag)` or generic annotations to recover information the adapter already owns. Keep low-level string key helpers private.

Preserve `InputOf`, `OutputOf`, and failure metadata on descriptors and bound options factories; an options factory's arguments are not the mutation payload. A shared extracted callback may use `OutputOf<typeof mutation.sessions.send>`; inline callbacks need no annotation. Keep query resource helpers restricted to query operations.

Acceptance fixtures must prove callback and optimistic-context inference, rejected invalid inputs/operation kinds, output-typed cache writes, matching bound/unbound keys, inheritance of defaults without overriding callbacks, isolated QueryClients, and a new operation appearing from its declaration alone.

## One mutation-defaults installer

Expose **`setMutationDefaults(client)`** from `@example/client-sdk/react`, where `client` is the TanStack QueryClient. Provider setup calls this single product-wide installer once when constructing each client, before any mutation consumers mount. Feature hooks do not repeat cache invalidation, optimistic updates, rollback, or reconciliation policy. This is intentional centralized setup, not another handwritten RPC method catalog.

The installer is defined at module scope and called by the module-defined client factory. Browser-only apps can construct/configure a singleton at module initialization. In Next, preserve the documented server/browser lifetime: fresh server QueryClients, retained browser client. Never make a shared server cache merely to place the invocation at module scope. Registration is synchronous and adds no RSC await.

```ts
// client-sdk/src/react/mutation-defaults.ts — one public setup entry point
import type { QueryClient } from '@example/libraries/query/react'
import { setUsersMutationDefaults } from '#client-sdk/features/users/react/mutation-defaults'

export function setMutationDefaults(client: QueryClient): void {
  setUsersMutationDefaults(client)
  // Other feature-owned policies register here as the product grows.
}

// client-sdk/src/react/index.ts
export { setMutationDefaults } from '#client-sdk/react/mutation-defaults'
```

```ts
// client-sdk/src/features/users/react/mutation-defaults.ts — internal policy
import type { QueryClient } from '@example/libraries/query/react'
import { query, mutation } from '#client-sdk/react/operation-descriptors'

export function setUsersMutationDefaults(client: QueryClient): void {
  mutation.users.update.setDefaults(client, {
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: query.users.list.key }),
        client.invalidateQueries({ queryKey: query.users.byId.key }),
      ])
    },
  })
}
```

The `query` and `mutation` imports here refer to shared API-derived operation descriptors, exposing keys and typed defaults registration without constructing a transport client. `createQuery(productClient)` binds those same operations to transport and cache scope for `getOptions(input)`; it must reuse their key construction. Do not add a parallel key-only method tree, hand-maintained endpoint list, or global credential-bearing SDK client. This unbound descriptor/bound-query implementation is proposed adapter work, not an existing export.

This policy intentionally invalidates the **operation prefixes**: every cached users list and every cached `users.byId` input in this QueryClient. It is not invalidation of one user ID. The prefix contains no caller scope, so it also spans any scopes in that cache. Choose this breadth deliberately; use the bound operation's full key when targeting one input/scope. Never retype API payloads or results for policy callbacks: derive them with the SDK helpers when needed.

Domain cache policy has **one owner**, here beside the client SDK's feature integration. If policy is already declared in API operation metadata, the installer derives from that metadata instead of defining it again. Backend declarations remain free of React/Query imports. Only operations needing explicit policy require such policy code; ordinary RPC methods still appear automatically.

```ts
// apps/web/app/query-client.ts — module-defined provider setup
import { environmentManager, makeQueryClient } from '@example/libraries/query/react'
import { setMutationDefaults } from '@example/client-sdk/react'
import type { QueryClient } from '@example/libraries/query/react'

function createConfiguredQueryClient() {
  const client = makeQueryClient()
  setMutationDefaults(client)
  return client
}

let browserClient: QueryClient | undefined

export function getQueryClient() {
  if (environmentManager.isServer()) return createConfiguredQueryClient()
  return browserClient ??= createConfiguredQueryClient()
}
```

The low-level Query library owns primitives and generic client configuration; it must not import the product SDK. App integration composes them. Native/SPA provider setup calls the same installer in its own factory. The installer sets defaults rather than adding event subscriptions; repeated registration must not accumulate callbacks. If a client needs disposal, its owner remains responsible.

```ts
// features/src/users/react/use-update-user.ts — no per-call invalidation
import { useQueryApi } from '@example/client-sdk/react'
import { useMutation } from '@example/libraries/query/react'

export function useUpdateUser() {
  const query = useQueryApi()
  return useMutation(query.users.update.mutationOptions())
}
```

Return the mutation result directly and infer the return type from the generated options. React Query is an accepted core primitive of the React integration: keep its discriminated state union, `mutate`, `mutateAsync`, and `reset` rather than manufacturing an action facade solely for hypothetical migration. The portable SDK root remains framework-free. UI-specific success behavior belongs in the feature controller after the action resolves; it does not replace cache policy. See [mutation result semantics and rendering](query-resources.md#mutation-hooks-return-the-native-result).

TanStack merges mutation defaults by matching mutation keys; register broader defaults before more specific ones. Explicit hook/options callbacks can override default callbacks rather than automatically composing them. Therefore generated options must preserve the matching mutation key and omit competing lifecycle callbacks; feature hooks must not override the owned cache lifecycle. Where an extension is necessary, compose it deliberately in the owned adapter. A per-call callback is not the owner of required consistency behavior. Verify against the installed implementation. [QueryClient defaults](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts).

The example awaits invalidation so the mutation stays pending until those refetches finish. Choose that completion behavior in the policy, once; use explicitly handled background invalidation only when the product wants the mutation to complete earlier. This is a mutation lifecycle decision, separate from the prohibition on awaiting at top-level RSC shells. [Mutation callback completion](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations).

Acceptance: a mutation invoked through its feature hook updates the expected queries without local invalidation; unrelated queries are unaffected; lifecycle defaults are not overwritten by generated options or UI callbacks; policies install before use; separate QueryClients never invalidate each other's caches. These snippets specify the integration to implement, not an already-built SDK.

## Portable domain interpretation

When needed locally, shared status labels/message keys, presentation ordering, and semantic tone belong beside the client SDK feature that interprets the documented API domain. Reuse values supplied by the API; do not override authoritative ordering, invent domain rules, or duplicate mappings in UI code. Types derive from the API output or the schema owned by its core feature.

Return semantic tokens and localization keys, not browser classes or React icon elements. DS/localization adapters render them for each platform. A feature can choose layout and decoration without changing canonical product meaning. Use shared fixtures when another language implements these helpers.

```ts
// client-sdk/src/features/deployments/index.ts
export * from '#client-sdk/features/deployments/display'

// An optional namespace view of owned ESM exports:
export * as Deployments from '#client-sdk/features/deployments'
```

Compose static helper exports through ESM modules; the root factory can expose the complete runtime client. Do not maintain `export const Deployments = { getDisplayStatus, ... }` method registries merely to reproduce namespace exports. Keep namespaces to safe public modules; dynamic namespace access and side effects can affect tree shaking and need a real build check.

## Streams and execution

The feature consumes assembled messages:

```ts
for await (const message of chat.sendMessage(input, { signal })) {
  renderMessage(message)
}
```

The feature-local client SDK adapter validates event schemas from the owning API/core feature, handles sequence/base versions, completion, failure, cancellation, and immutable snapshots. It owns patch mechanics, not the screen. AsyncIterable/Promise signatures alone do not type thrown errors; provide a runtime error normalization boundary when adapting Effect failures.

Configure HTTP/WebSocket/local capabilities once at the host/provider. Substitution must preserve declared cancellation, backpressure, resume, authorization, and failure semantics. Instance/runtime factories are appropriate there; repeatedly rebuilding a product API at call sites is not.


## Vanilla root and optional peers

The root client has no React/Next imports or type-declaration requirements. All React integration is exposed from the explicit `react/` folder and `./react` export. Declare React as an optional peer when that adapter needs it; a root-only user must not need React installed. Apply the same rule to `rpc/react`, `api/next`, and `api/bun`. See the [package recipes](recipes.md#3-package-exports-and-optional-peers) for a manifest and allowed/blocked imports.

A lower-level `RpcProvider` belongs at `@example/rpc/react`. Expose a higher-level SDK `ClientSDKProvider` only when it supplies the product client/query semantics. Do not require redundant nested providers with identical responsibilities; the higher-level integration may compose the lower-level provider internally.
