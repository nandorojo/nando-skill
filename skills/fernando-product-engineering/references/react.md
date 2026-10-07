# React contracts and composition

## Composition reference

This is the application of Fernando's composition principles to the larger architecture. Whenever writing or refactoring React code, consult `vercel-composition-patterns` and its relevant rules before editing; reuse guidance already loaded for the task. If unavailable, report that and use this reference as the fallback. The composition skill covers detailed rules on compound components, interface-driven context, lifted state, explicit variants, and children composition. The core rules are self-contained here:

- Provider owns the contract boundary; it need not own the state implementation.
- Implementer hooks return the same narrow contract. Presentational parts cannot know which hook created it.
- Sibling actions outside a component's visual frame can consume the same provider.
- Compose distinct trees for new, existing, editing, and forwarding flows. Shared internals are public escape hatches.
- Prefer children for structure. A virtualizer's data-dependent `renderItem` remains appropriate.

## Modern React and React Compiler

New React code in adopting products uses modern React (19+) with React Compiler enabled. Pin compatible React, compiler, framework, and lint versions in the target repo. Follow the framework-specific integration in the official [compiler installation guide](https://react.dev/learn/react-compiler/installation); verify that the actual web build compiles our React feature/DS source, including owned React re-exports. A dependency installed in a manifest is not evidence that the transform ran.

Keep the compiler's diagnostics in the lint workflow. Current `eslint-plugin-react-hooks` exposes compiler diagnostics; use its supported recommended preset instead of the old separate `eslint-plugin-react-compiler` package. A diagnostic can mean a component was skipped while the rest of the build succeeded. Our CI policy requires investigating those diagnostics, even when the framework build exits successfully. [Official lint reference](https://react.dev/reference/eslint-plugin-react-hooks).

```js
// Inside the owned lint-config package: merge with its TS parser/base config.
import reactHooks from 'eslint-plugin-react-hooks'

export const react = {
  ...reactHooks.configs.flat.recommended,
  files: ['**/*.{js,jsx,ts,tsx}'],
}
```

Use the preset exported by the pinned plugin version. The current plugin documents `configs.flat.recommended`; `recommended-latest` includes experimental rules and is a deliberate upgrade choice. [Plugin configuration](https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/README.md).

```json
{
  "scripts": {
    "lint:react": "eslint packages apps --max-warnings=0"
  }
}
```

This supplementary ESLint command preserves the compiler diagnostics until equivalent configured Oxlint coverage is verified; Oxlint remains the primary linter and Oxfmt the formatter under the [styleguide](styleguide.md). This is a proposed script fragment for a monorepo whose ESLint configuration already includes the owned React rules and TS parser. Scope paths to the adopting repository and exclude generated output. `lint:react` runs compiler-powered static diagnostics; CI also runs the framework build with the compiler enabled. No standalone compiler CLI is assumed. Agents run the same script after relevant React edits and use a targeted build when changing compiler configuration or investigating a transform issue.

When the check fails or compilation skips a relevant component:

1. Read the diagnostic, source location, affected hook/component, and pinned versions. Distinguish a Rules-of-React violation, unsupported dependency/syntax, configuration issue, and an unexpected compiler failure.
2. Fix the cause at its owner, then rerun the check. Do not disable the rule or add memoization solely to hide it. Keep provider state ownership/composition intact; compiler optimization does not replace those boundaries.
3. Verify actual compilation when in doubt using build output, DevTools, or compiler logger events. Record skipped functions and their reasons where the integration supports logging; lack of a diagnostic alone does not prove compilation coverage. [Compiler logger](https://react.dev/reference/react-compiler/logger).
4. For a behavior regression, isolate the affected component and compare compiled/uncompiled behavior. A temporary local `use no memo` opt-out must carry a concrete reason and follow-up; remove it once resolved. Do not rely on memoization for correctness. [Compiler debugging](https://react.dev/learn/react-compiler/debugging).

For a new repo, fail CI on unaddressed lint warnings/errors. During adoption in an existing repo, any temporary exceptions must be narrowly scoped, explained, and tracked; do not hide new failures in a broad baseline. These are CI conventions to implement, not checks already running in this architecture-kit repository.

### Capture handler dependencies during render

Destructure stable functions used inside event handlers at render scope. For example, use `const { reset, mutate } = useSendMessages()` and call `reset()` inside `patch`; avoid closing over the changing mutation result just to call `submission.reset()`. The same applies to query actions and context actions where their contracts provide independently usable functions. This lets React Compiler track the actual function dependency instead of the whole changing result. It does not make the mutation result itself stable or prevent its observer from rerendering. Do not detach methods that require their receiver, and do not rest-destructure tracked query results.

### Composer drafts and submitted messages have separate lifetimes

A draft contains editable input. Allocate a request/message ID when accepting a submission, not on every keystroke. Once sent, the submitted variables own that ID and content. For chat-style optimistic sends, clear the composer immediately and keep pending/failed input in the transcript with a message-owned `retry()` action. Retrying must not clear or restore over a newer draft. Reuse request IDs for uncertain delivery; only create a new attempt when the backend protocol requires it, with that policy owned by the vanilla SDK.

Keep submission lifecycle callbacks in the owning mutation hook or central SDK mutation policy; avoid substantial inline `mutate(input, { onSuccess, onError })` logic. Ordinary synchronous draft clearing belongs in the submit hook/action. Preserve centralized cache reconciliation. Read multiple pending/failed submissions from the shared mutation cache through a scoped `useMutationState` adapter, rather than treating one composer's latest mutation observer as the transcript history. Define retention for recoverable failures.

Session queries, editable composer state, and stream/submission subscriptions have different owners. A session provider supplies its query result unchanged; a composer provider owns the draft. Compose independent provider implementations so typing does not rerun the session observer or transcript owner. See [mutation subscriptions](query-resources.md#submission-lists-and-message-owned-retry).

## Never manage promises manually

React components and hooks never manage promise lifecycle manually. For basic async actions, use React's `useTransition` and its pending state. For complex promises or data-based operations, use `useQuery` for reads and `useMutation` for mutations through the existing owned Query integration and feature-local hooks.

Never use manual `setState` calls to coordinate loading, pending, result, success, or error state around a promise, whether through `async`/`await`, `try`/`catch`/`finally`, or `.then()`/`.catch()`. Moving that bookkeeping into a custom hook, reducer, or helper does not make it acceptable. Consume the chosen primitive's lifecycle directly; do not mirror it into local state. If a basic action needs richer result/error handling than a transition provides, use Query's appropriate operation primitive.

Local state still owns independent UI facts such as editable drafts and selection. This rule governs React promise lifecycle, not ordinary promise composition inside server services or vanilla SDK implementations.

## Minimal state and derived forms

Start with an aversion to creating new state. Before adding a state variable, store field, or synchronization effect, identify the independent fact it owns. If the value can be derived from existing inputs, query data, or state, derive and recompose it where needed instead. A derived context/view value does not need its own state owner.

Store plain IDs for entity selection and relationships, such as `selectedUserId`, and resolve the entity from already-fetched network/query data. Do not also store `selectedUser` with its name and other server fields in app state. Keep fetched data in its existing query/cache owner; do not mirror it into context, a client store, or a form, or fetch it again solely to resolve an ID already covered by available data. Handle an unresolved ID explicitly.

For an existing-user form, retain the user ID and only the user's editable overrides. Derive displayed values and the submission input by combining the current fetched user with those overrides on the fly. Never initialize form state with the fetched `user` object or spread the entire record into a second editable owner. Untouched fields derive from the source; edited fields use the override. Track override presence explicitly so deliberate empty strings, `false`, or nullable clears do not fall back to server values. Reset clears overrides; changing entity identity starts the appropriate draft. Refetches must not overwrite user edits.

Local state is appropriate for independent facts such as unsaved input, selection IDs, and interaction state. Intentional caching belongs in an explicit network/cache layer with an owned update/invalidation policy. A product requirement for a fixed editing baseline or durable draft needs explicit snapshot/version and conflict semantics; it is not a reason to mirror fetched entities by default. Prefer derivation until an independent lifetime or behavior actually requires storage.

## Explicit implementations instead of mode arguments

Apply composition to hook/function arguments as well as component props. Avoid `useSurface({ kind: 'terminal' | 'computer' })` that branches into different workflows. Prefer explicit terminal and computer providers/hooks that compose shared capabilities. Do not hide the branch in a generic options object or renamed helper. See [operation composition](contracts-backend.md#compose-operations-instead-of-mode-arguments).

## Contract first

Treat context providers as the React expression of dependency injection: consumers depend on a state/actions contract, and an implementer provider supplies it for that subtree. This is the same architectural principle used by Effect layers on the backend. The provider owns selection and scope; descendants do not discover or construct their own implementation.

For a composer, the public context separates controllable values from implementation-derived information: `state` contains the editable draft values; `actions` changes those values or runs operations; `meta` exposes submission lifecycle, typed errors, derived eligibility, and refs/capabilities. Define runtime schemas for serializable draft/action/result/lifecycle values and infer their types. Define executable capabilities and ref interfaces directly; they are not JSON schemas.

```ts
type ComposerContract = {
  state: ComposerDraft
  actions: {
    patch(patch: ComposerDraftPatch): void
    replace(draft: ComposerDraft): void
    reset(): void
    submit(): Promise<SubmitResult>
  }
  meta: {
    canSubmit: boolean
    submission: ComposerSubmission
    inputRef: RefObject<ComposerInputHandle | null>
  }
}
```

`ComposerDraft`, `ComposerDraftPatch`, `ComposerSubmission`, and `SubmitResult` derive from their owning schemas. `ComposerSubmission` is the discriminated lifecycle value (for example idle, submitting, succeeded, or failed with a typed error); it belongs under `meta`, never among the draft fields. `RefObject` comes from the owned React entry point and `ComposerInputHandle` is an owned platform-neutral capability such as `{ focus(): void }`, not a DOM/native element leaking into the portable contract. A direct focus capability in `meta` is also appropriate when consumers do not need the ref itself.

Prefer typed draft actions `patch({ title })`, `replace(draft)`, and `reset()` over one setter per field such as `changeTitle` and `changeBody`. Define their runtime input schemas beside the draft schema and derive their types. `patch` merges permitted editable fields, `replace` supplies a complete editable draft, and `reset` restores the documented initial/default draft. These actions still enforce validation and submission concurrency; they do not let consumers overwrite derived status, identity, permissions, or operation results. Keep semantic workflow actions such as `submit` for actual operations. Do not default a missing provider to fake no-op actions: the accessor should fail clearly on a missing provider. Deliberate mock providers are a different, explicit implementation.

The implementer may internally use a state machine with `editing`, `submitting`, and `failed` states; that does not put operation lifecycle into the context's public `state`. Project controllable draft values to `state` and lifecycle/derived values to `meta` without copying them into a second independently synchronized owner. Define transition semantics: whether editing during submit is supported, how a successful send clears the submitted revision without erasing newer text, and how duplicate submission is prevented. A disabled button alone does not enforce concurrency; implement the invariant in the controller/operation too.

Submission eligibility comes from the implementer's domain contract. A shared Submit part must not assume text is required: forwarding may allow an empty comment, and sending may allow attachments without text. Expose derived eligibility as `meta.canSubmit` (and a typed reason when needed), and recheck the invariant in the action. Consumers must not patch `canSubmit`, submission status, or errors through draft actions. This classification governs the headless context contract; it does not require renaming a query resource's native status fields or prohibit internal workflow state machines.

Do not conditionally call different hooks. Put different initial implementations in separate provider components, or use a stable controller/store capability behind one provider. Hook implementations can be swapped at composition time; arbitrary runtime hook-function injection is not a safe plugin mechanism.

## Components consume hooks; hooks adapt the SDK

Components mostly call hooks/helpers and compose their results into UI. Feature-local hooks own local editable state, action wiring, and consumption of SDK React capabilities. Reusable state transitions, sequencing, retry/backoff, recovery, cancellation policy, enum interpretation, validation, and protocol assembly belong in the vanilla SDK/core. Moving business logic from a component into a hook is insufficient if another non-React client still needs to copy it.

Treat `useEffect` and `useLayoutEffect` anywhere in client code as a severe architectural smell, permitted only for extreme, documented synchronization needs that existing owned primitives cannot handle. Portable feature components and hooks must not use `useEffect` or `useLayoutEffect`, directly or through aliases/re-exports. Server reads and mutations use the derived SDK React Query integration. External subscriptions use an owned SDK React adapter, such as a static `useSyncExternalStore` bridge to a vanilla controller. DOM/native synchronization belongs in an explicitly registered host adapter. An exceptional effect allowance explains why derivation, event actions, Query, and existing subscription primitives cannot solve the requirement, and identifies the exact adapter path, capability, lifetime/cleanup, and justification; it is not a blanket exemption for any file named `use-*` or `react/`. Adapter effects must not absorb reusable product lifecycle policy.

For example, a feature hook running `useEffect(() => { client.open(input).then(setConnection) }, [input])` is rejected, even through an owned React re-export. A read hook returning `useQuery(query.documents.byId.getOptions(input))` is the expected request boundary; a live-connection hook consumes the SDK controller through its public React subscription adapter. Do not move the same promise chain into a renamed helper or mount callback to evade ownership.

Keep simple presentation expressions, exhaustive state rendering, and wiring an action to a prop in components. Do not put a product algorithm, protocol reducer, or substantial action implementation inside the render function, a nested callback, or `useMemo`. Hooks also run during render; extraction changes ownership, not permission to perform side effects during render. Execute side effects through the appropriate action/lifecycle adapter.

### Feature-local data hooks

Wrap query/mutation/subscription usage once at the feature's React consumption boundary. Components consume the resulting owned resource/state/actions contract, including a deliberately narrowed Query-compatible type when appropriate. They do not inline `useQuery(query.users.byId.getOptions(...))` throughout the UI. Mutation hooks intentionally return the full inferred `useMutation` result because Query is a chosen core primitive; query hooks retain their type-only projection. See [the mutation decision](query-resources.md#mutation-hooks-return-the-native-result).

```text
features/src/users/
  use-user-by-id.ts    # React data-source adapter; input inferred from SDK
  schema.ts           # only local UI state additions; reuse API/SDK data types
  contract.ts         # only when an actual state/actions contract is needed
  details.tsx         # consumes the hook; composes UI
  provider.tsx        # optional shared owner
  context.tsx         # optional contract provider/accessor
  react/index.ts      # intentional React public barrel
```

Colocate by feature, not in a global `hooks/` folder. An equivalent hook used by multiple independent products can live in `client-sdk/src/features/users/react.ts` and be exposed through `client-sdk/react`. Choose one owner; do not duplicate its implementation in both packages.

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

`ResourceOf<UserRead>` derives a narrow **type-only projection** of the result, defined in [query resources](query-resources.md#one-owned-type-projection-no-runtime-mapper). The runtime result is returned unchanged to preserve property tracking. Do not eagerly normalize or spread the observer into a new state object. Explicit workflow state machines remain valid when a consumer actually needs their derived state; they are not a mandatory adapter for every query.

```tsx
// features/src/users/details.tsx
import type { InputOf } from '@example/client-sdk'
import { useUserById } from '#features/users/react/use-user-by-id'
import { UserView } from '#features/users/react/view'

export function UserDetails({ id }: InputOf<typeof useUserById>) {
  const user = useUserById({ id })
  return <UserView resource={user} />
}
```

Prefer flat component props such as `<UserDetails id={userId} />`; derive their types from the operation/hook instead of duplicating the API shape. A hook can still accept the API's `{ id }` input object internally. Reserve an `input` prop for a component whose actual product concept is an input object, not a mechanical wrapper around every operation payload.

The hook is a deliberate place to change how data arrives. It consumes the existing inferred query options; it does not rebuild query keys, payload types, or an operation registry. This differs from the prohibited per-route `createQueries` scaffolding. A small hook is useful even when its main purpose is to keep components independent of the data source.

### Optionally own the hook in a provider

When several parts need one shared state/controller or subscription owner, call the hook inside a headless provider and pass its result down. This is optional; do not add a provider for every query. Calling a custom hook from several components does not itself create one shared hook instance.

```tsx
// features/src/users/provider.tsx
import type { InputOf } from '@example/client-sdk'
import type { ReactNode } from '@example/libraries/react'
import { UserContextProvider } from '#features/users/react/context'
import { useUserById } from '#features/users/react/use-user-by-id'

export function UserProvider({ id, children }: InputOf<typeof useUserById> & {
  children: ReactNode
}) {
  const user = useUserById({ id })
  return <UserContextProvider value={user}>{children}</UserContextProvider>
}
```

In this composition, descendant parts use the context accessor instead of each running `useUserById`. Query tracks accesses for the provider's observer; context consumers do not acquire independent per-field subscriptions. Measure context fan-out rather than assuming leaf-level Query tracking survives unchanged. Keep independently updating hook owners in separate provider wrappers. “Once” means one hook owner per mounted provider scope, not a hook that runs only on the first render.

A later WebSocket implementation can satisfy the same resource contract through this hook or an injected SDK store. Connection management, decoding, reconnect policy, and stream assembly remain below React consumers. Preserve cancellation, state semantics, auth scope, and cache coherence; a subscription is not automatically equivalent to a query. Choose an implementation through a stable capability/provider boundary, never conditional hook calls. Existing RSC prefetch still uses the same API-derived option helpers independently of the feature hook.

## Suspense and where a resource is read

Non-suspending queries remain the default. Suspense is an explicit alternative with a distinct hook/return contract and a parent pending/error/reset boundary. In Query v5 this uses `useSuspenseQuery`, not a `suspense: true` option on `useQuery`. See [query-resource examples](query-resources.md#suspense-is-an-explicit-alternative).

Dependency injection does not mean resolving every dependency in a high provider. Passing a stable promise through context and reading it with React `use` at the leaf preserves the location that can suspend. The Next integration must distinguish that server snapshot from a live URL source. Do not pass custom hook functions through context to defer their execution; keep calls static and inject values, promises, or ordinary store capabilities. [Route read placement and alternatives](platforms.md#route-reads-suspend-where-they-are-consumed).

## Legal query states

Use [UI states](ui-states.md) for the required data-first rendering order, shared design-system states, feature content/state composition, and exhaustive typed errors.

Model the distinction between data availability and fetch activity. An example explicit list-view contract (when needed by that view, not an eager normalization requirement for every query):

```text
unresolved                    required identity/input not available
initial
  idle                        enabled policy says do not fetch yet
  loading                     no data, request in flight
  paused                      no data, offline/paused
failed                        no usable data, initial attempt failed
ready
  data: [] | nonempty list     empty is a successful result
  refresh: idle | fetching | paused | failed(error)
```

Render a skeleton only for the initial no-data loading state. For a successful empty list, render the empty experience. Retain usable data during refresh and expose refresh failure separately. Distinguish a disabled query from a loading request; `isPending` alone is not “actively fetching.” Placeholder data, optimistic data, and permissions can require additional declared states if the product uses them.

Exhaustively switch on the normalized discriminant, then write `state satisfies never` followed by `return null` in a React renderer. Do not use `assertNever` or another runtime-throwing exhaustiveness helper; a new unhandled variant must fail typechecking. Validate state from persistence or external events before trusting it. Types reduce representable mistakes but do not prove asynchronous transition correctness.

## Boundaries within a feature

```text
composer/schema.ts            serializable state and action values
composer/contract.ts          state/actions/meta capability interface
composer/context.tsx          context + accessor + injected Provider
composer/input.tsx            consumes contract, renders DS input
composer/submit.tsx           consumes contract, renders DS button
composer/providers/new.tsx    implements contract for creation
composer/providers/existing.tsx implements it for an existing chat
screens/new.tsx               explicit composition
screens/existing.tsx          explicit composition
```

Do not make every leaf fetch. A provider implementation uses an owned client SDK hook or controller; descendants consume its interface. Keep context boundaries at the ownership scope, not an enormous global object that causes every keystroke to update every feature. Split independently changing contracts when behavior or measured rendering warrants it.

Keep feature entry points narrow enough for consumers to compose the internals. A convenient `ExistingChatScreen` is fine if `Composer`, `Messages`, and `Computer` parts remain available. Convenience compositions must not be the only public API.

## One app cache, many feature observers

The application host owns one stable browser `QueryClient` and mounts one `QueryClientProvider` above its routes/features by default. Reuse the existing owner when adding a feature, page, modal, or independently updating resource. Do not create a feature-local client factory, browser singleton, or nested Query provider to achieve subscription isolation. Separate module singletons are still separate caches.

Distinguish the three responsibilities:

- `QueryClientProvider` supplies the shared request/cache/mutation infrastructure.
- The SDK `ClientSDKProvider` supplies the API SDK client and inferred operation helpers (the SDK calls backend operations; QueryClient caches/manages their requests); it does not create a Query cache per consumer.
- Optional feature context providers own observers, controllers, or local editable state and consume the shared infrastructure. They do not need a provider for every query.

```tsx
// Illustrative ancestry across app bootstrap and route composition.
// QueryClient and SDK contexts belong to app Providers; feature contexts belong below it.
<QueryClientProvider client={queryClient}>
  <ClientSDKProvider client={sdkClient}>
    <UsersProvider>
      <ChatWorkspaceProvider>{children}</ChatWorkspaceProvider>
    </UsersProvider>
  </ClientSDKProvider>
</QueryClientProvider>
```

The root layout mounts this app-owned setup once. The real app `Providers` normally passes `{children}` through the infrastructure contexts; feature providers are mounted by the route/feature composition below it. The tree above illustrates ancestry, not a requirement to import all features into the root. No forwarding-only wrapper is needed around either infrastructure provider.

Feature-specific query options, generated keys, and colocated mutation policies all work within this shared cache. Independent observers already have their own subscriptions; splitting caches breaks shared deduplication and cross-feature invalidation. Install the product mutation defaults once when constructing the shared client.

This is an application lifetime rule, not a process-global server singleton. SSR/prefetch QueryClients stay request-isolated; server prefetch boundaries and hydration boundaries do not justify extra browser providers. Tests get isolated clients. A separately embedded application or a deliberate security/cache-isolation boundary may own another client, with an explicit reason and defined lifetime. Feature colocation or rerender isolation alone is not that reason. Follow the [official Next lifetime recipe](platforms.md#react-query-in-nextjs-follow-the-official-integration).

## One state owner per provider wrapper

Put independently changing hooks/subscriptions inside their own feature context provider implementation, not together in the component that nests providers. These wrappers share the app QueryClient described above; the rule separates subscription owners, not caches. The composition component receives/passes children and chooses structure only.

```tsx
function ChatWorkspacePanelsProvider({ workspaceKey, children }: PanelsProviderProps) {
  const panels = useWorkspacePanels(workspaceKey)
  return <Panels.Provider value={panels}>{children}</Panels.Provider>
}

function ChatWorkspaceComposerProvider({ session, children }: ComposerProviderProps) {
  const composer = useSessionComposer(session)
  return <Composer.Provider value={composer}>{children}</Composer.Provider>
}

function ChatWorkspaceProvider({ session, children }: ChatWorkspaceProviderProps) {
  return (
    <ChatWorkspacePanelsProvider workspaceKey={session.workspaceKey}>
      <ChatWorkspaceComposerProvider session={session}>
        {children}
      </ChatWorkspaceComposerProvider>
    </ChatWorkspacePanelsProvider>
  )
}
```

Name headless context/state wrappers with a `Provider` suffix, including wrappers that compose other providers: `ChatWorkspaceProvider` accurately describes this component. Reserve `Screen`, `Layout`, `Panels`, or `Frame` for visual composition. A provider passes through potentially visible children, but should not hide its own application UI behind a headless name. Naming communicates responsibility; imports and implementation still establish the boundary.


A wrapper's own update retains its supplied children element identity, so it need not re-execute an unrelated provider beneath it. Putting both hooks inside ChatWorkspaceProvider reruns both whenever either updates. Preserve this boundary before considering memoization. Do not move the other subtree creation back inside the stateful wrapper. Review the subscription owners, not the number of hooks: multiple local hooks for one cohesive owner are valid. Verify that an update isolated to one resource does not rerun an unrelated resource owner; a lint advisory cannot prove this behavior.

React can reuse unchanged JSX elements, but changed context still updates its consumers and their own state updates still run. The documented `Object.is` comparison of individual props is `memo` behavior, not a universal shallow comparison for every ordinary function component. [React memo/children guidance](https://react.dev/reference/react/memo), [JSX identity](https://react.dev/reference/react/useMemo#memoizing-individual-jsx-nodes).

## Identity and transitions

Different provider component types at the same position can remount the subtree; so can keys and ancestor structure changes. For new-chat → existing-chat transitions, choose an intentional retention strategy: maintain a stable session/controller above routing, keep the provider type and layout position stable, or explicitly persist and restore selected state. A stable value alone does not prevent an ancestor route from remounting it. [React state identity](https://react.dev/learn/preserving-and-resetting-state).

Use composition for choosing initial trees, and a state machine for transitions within a persistent tree. These requirements complement each other. Do not force a boolean-mode component just to preserve state when a stable provider can hold a discriminated session. Do not pretend a rerender is necessarily a remount.

Ordinary conditions driven by state (loading, access denied, validation error) are expected. The smell is consumer-provided mode flags choosing whole workflows. `disabled`, `selected`, `expanded`, and accessibility booleans are not categorically banned. The enforcement rule must inspect intent/patterns and permit scoped exceptions where identity constraints require them.

## Portability limits

Features use React and owned DS interfaces. That makes them candidates for React web/native/desktop hosts with working adapters. A React component does not become a Vue component; Vue/Swift consumers reuse the transport/client semantics or their equivalent SDK and reimplement UI. A client component can participate in an RSC application, but hooks/context code is not executable as a Server Component. Isolate client boundaries and explicit RSC wrappers accordingly.

Do not read browser globals at module evaluation or during SSR render. Browser/native synchronization belongs in registered host adapters with lifecycle-managed cleanup; portable feature components and hooks remain effect-free. Use owned semantic refs such as `focus()` where needed, not a DOM node or RN TextInput in a shared feature contract.

React 19 supports `use(Context)` and ref-as-prop; `useContext` still exists. Preserve the target version and avoid importing an inaccurate “removed API” rule. [React use](https://react.dev/reference/react/use), [React useContext](https://react.dev/reference/react/useContext).

## Mutation feedback without layout shifts

Use the shared Button loading contract for trigger-owned progress: disabled duplicate submission, accessible busy state, and dimmed presentation with stable geometry. Dimming/disabled state alone is insufficient: show meaningful progress text or another clear visible indicator. Reserve both idle and pending label dimensions so changing text cannot move the control or its neighbors. Read pending directly from the owned mutation/transition primitive. A later query or subscription status belongs to the resource's stable status area, independently of mutation settlement. See [visual continuity](ui-states.md#visual-continuity-across-asynchronous-states) for query, error, and verification rules.
