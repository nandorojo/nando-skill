# Example book: write the consumption story first

These are proposed call sites and design sketches, organized in the order you would design them. They are deliberately more concrete than general guidelines. Package aliases and owned helper names describe the proposed API, not existing published packages. Unless explicitly stated, these snippets have not been compiled together; omitted adapters are named responsibilities, not implied working implementations.

The separate `examples/contract-slice` contains compiled behavioral examples, now colocated by feature. Its Zod wiring is a legacy fixture for those invariants, not the selected product stack. Product examples below use Effect RPC + Effect Schema's v3 API family; see [the backend recipe](contracts-backend.md) for exact version/source notes. Effect and Next integration snippets are source-checked design examples, not an executed full-stack application.

Contents:

1. Consumer story and mocked tree
2. Owned dependency facades
3. Feature-local schemas and one API declaration
4. Complete client and operation-derived types
5. SDK presentation and streams
6. Feature hooks, tracked query resources, and optional Suspense
7. Composer contract, parts, and implementations
8. Panel composition and retained identity
9. Web/native DS implementation
10. Routing and RSC entry points
11. Local CLI versus sandbox execution
12. Negative examples and acceptance scenarios

## 1. Begin with the feature you want to read

```tsx
// features/src/chat/screens/react/existing.tsx
import { Chat } from '#features/chat/screens/parts'

export function ExistingChatScreen() {
  return (
    <Chat.Panels.Root>
      <Chat.Panels.Panel placement="conversation">
        <Chat.Messages.List />
        <Chat.Composer.Frame>
          <Chat.Composer.Input />
          <Chat.Composer.Footer>
            <Chat.Composer.Attachments />
            <Chat.Composer.Submit />
          </Chat.Composer.Footer>
        </Chat.Composer.Frame>
      </Chat.Panels.Panel>
      <Chat.Panels.Panel placement="computer">
        <Chat.Computer.View />
      </Chat.Panels.Panel>
    </Chat.Panels.Root>
  )
}
```

This screen assumes contracts above it, not a router or data-fetching implementation. Panel placement is semantic data, not `isNative` selecting a workflow.

```tsx
// features/src/chat/screens/react/new.tsx
export function NewChatScreen() {
  return (
    <Chat.Panels.Root>
      <Chat.Panels.Panel placement="conversation">
        <Chat.Welcome />
        <Chat.Composer.Frame>
          <Chat.Composer.Input />
          <Chat.Composer.Footer>
            <Chat.Composer.Submit />
          </Chat.Composer.Footer>
        </Chat.Composer.Frame>
      </Chat.Panels.Panel>
      <Chat.Panels.Panel placement="computer">
        <Chat.Computer.Empty />
      </Chat.Panels.Panel>
    </Chat.Panels.Root>
  )
}

// features/src/chat/screens/react/mobile.tsx — another composition of the same parts
export function MobileConversationScreen() {
  return (
    <Screen.Root>
      <Chat.Messages.List />
      <Chat.Composer.Frame>
        <Chat.Composer.Input />
        <Chat.Composer.Submit />
      </Chat.Composer.Frame>
    </Screen.Root>
  )
}
```

Native navigation can put Computer.View on another screen. No shared component needs to discover its host or hide half a desktop layout. Names in this opening tree are the target surface to implement, not a reason to create meaningless empty components. An early mock screen can render structural parts only and use explicit mock providers while internals are unfinished.

## 2. Own dependencies without inventing new primitives

```ts
// libraries/react/index.ts — approved React ownership surface
export {
  createContext,
  use,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from 'react'
export type { ReactNode, Ref, ComponentType } from 'react'

// libraries/effect/index.ts — named owned foundational APIs
export { Effect, Layer, Schema } from 'effect'

// libraries/effect/rpc.ts
export { Rpc, RpcGroup, RpcClient, RpcServer, RpcSerialization } from '@effect/rpc'

// libraries/query/react/index.ts — explicitly owned adapter API
export { useQuery, queryOptions, mutationOptions } from '@tanstack/react-query'
```

The Effect facade deliberately owns the selected engine's vocabulary. Feature-local schema files infer their types from it; there is no global schema/contract catalog or duplicated DTO interface. By contrast, feature consumption types require deliberate dependency boundaries. Native `useMutation` results are an accepted React primitive; other full vendor observers/component props are not automatically public contracts. Add named APIs to a vendor facade deliberately; do not wildcard-export the vendor. Star exports over owned public modules remain the preferred namespace composition mechanism.

```ts
// design-system/virtualizer/contract.ts
import type { ReactNode } from '@example/libraries/react'

export interface VirtualizerProps<Item> {
  items: readonly Item[]
  getKey(item: Item): string
  renderItem(item: Item): ReactNode
  estimatedItemSize: number
}
```

The web and native implementations own different virtualization vendors. Expose additional capabilities only when a real caller requires them, such as an owned `scrollToKey` handle. A render callback here is appropriate because the virtualizer provides data. A dozen `renderHeader`/`showFooter` props on the whole chat would be the wrong level of composition.

## 3. Schema → DB → service → API

```text
core/src/features/users/
  api/
    schema.ts    # authoritative public data
    rpc.ts       # client-safe wire declaration
    index.ts     # binds UsersService for mounting
  service.ts     # one UsersService class export
  db.ts          # private scoped persistence
```

```ts
// core/src/features/users/api/schema.ts
import { Schema } from '@example/libraries/effect'

export const User = Schema.Struct({ id: Schema.String, name: Schema.String })
export const GetById = Schema.Struct({ id: Schema.String })
export const Unavailable = Schema.Struct({ _tag: Schema.Literal('users.unavailable') })
export type User = typeof User.Type
```

```ts
// core/src/features/users/api/rpc.ts — wire declaration, client-safe
import { Rpc, RpcGroup } from '@example/libraries/effect/rpc'
import { GetById, Unavailable, User } from '#core/features/users/api/schema'

export const UsersRpc = RpcGroup.make(
  Rpc.make('users.byId', {
    payload: GetById,
    success: User,
    error: Unavailable,
  }),
)
```

```ts
// core/src/features/users/service.ts — authorized domain service
import { Effect } from '@example/libraries/effect'
import type { GetById } from '#core/features/users/api/schema'
import { UsersDb } from '#core/features/users/db'
import { CurrentActor } from '#core/features/auth/actor'
import { requireUserRead } from '#core/features/users/policy'

export class UsersService {
  static getById({ id }: typeof GetById.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireUserRead(actor, id)
      const db = yield* UsersDb
      const record = yield* db.findById({ id, scope })
      return { id: record.id, name: record.name }
    })
  }
}
```

```ts
// core/src/features/users/api/index.ts — server binding, consumed by API mounting
import { UsersRpc } from '#core/features/users/api/rpc'
import { UsersService } from '#core/features/users/service'

export const UsersApi = UsersRpc.toLayer({
  'users.byId': UsersService.getById,
})
```

The service has one named `UsersService` export. Static methods use Effect for dependency injection rather than storing mutable request state on the class. This deliberately accepts a possible method-level tree-shaking cost; [the service convention](contracts-backend.md#one-named-service-export) explains the boundary.

This binding is necessary: it says which implementation handles a declared procedure and checks its input/success/error contract. It is not a second DTO or client method interface. `UsersDb`, `CurrentActor`, and `requireUserRead` are real injected capabilities/policy to implement; expected errors must match or map to the declared failure schema. Keep service authorization effective for both RPC and approved direct server callers.

```ts
// api/src/rpc/index.ts — explicit client-safe public barrel/aggregate
import { RpcGroup } from '@example/libraries/effect/rpc'
import { UsersRpc } from '@example/core/users/rpc'
import { ChatRpc } from '@example/core/chat/rpc'

export const ApiRpc = RpcGroup.make().merge(UsersRpc, ChatRpc)
```

```ts
// api/src/index.ts — SERVER public entry point (mounting sketch)
import { RpcServer } from '@example/libraries/effect/rpc'
import { ApiRpc } from '@example/api/rpc'
import { ApiLive } from '#api/live'

export type Api = typeof ApiRpc
export const { handler, dispose } = RpcServer.toWebHandler(ApiRpc, { layer: ApiLive })
```

`ApiLive` combines the feature API layers and the required auth, DB, protocol serialization, and platform dependencies once. The host mounts `handler(request)` and owns `dispose()`. Creating this host must not happen in a browser import. The fixture does not implement those dependencies; this is the intended file/consumption shape. [Effect web-handler API](https://github.com/Effect-TS/effect/blob/v3/packages/rpc/src/RpcServer.ts).

```ts
// rpc/src/types.ts — only used by this package's public barrel
import type { Api } from '@example/api'
import type { RpcClient } from '@example/libraries/effect/rpc'

export type Rpc = RpcClient.FromGroup<Api>
```

```ts
// rpc/src/client.ts — private implementation behind the RPC public entry point
import { RpcClient } from '@example/libraries/effect/rpc'
import { ApiRpc } from '@example/api/rpc'

const acquire = RpcClient.make(ApiRpc)
```

**These two imports have different jobs.** `Api` is a type alias describing the same aggregate group and is erased. `ApiRpc` is the actual runtime group; Effect consumes its schemas to encode payloads and decode results. `import type { ApiRpc }` followed by `RpcClient.make(ApiRpc)` cannot work. The runtime value must come exclusively from the client-safe barrel, never the server mounting barrel. The module graph must exclude service/DB/live layers, credentials, and server middleware implementations. [Effect client encoding/decoding implementation](https://github.com/Effect-TS/effect/blob/v3/packages/rpc/src/RpcClient.ts).

The owned RPC/client SDK implementation acquires/runs the scoped client once per intended runtime lifetime and disposes it at teardown. Consumers obtain the full product through `createClient`, not through `acquire`. Server API types remain type-only; runtime codecs remain intentionally present. If the requirement becomes zero runtime schema imports as well, that is a different client strategy from Effect's standard client and needs an explicit design decision.

## 4. One whole-product client, one query interface

```ts
import { createClient } from '@example/client-sdk'
import { createQuery } from '@example/client-sdk/react'

// App/request composition root, once for the intended lifetime.
const client = createClient({ baseUrl: '/api/rpc' })
const query = createQuery(client)

const user = await client.users.byId({ id })
const options = query.users.byId.getOptions({ id })
```

```ts
// Derive from the real objects above; do not repeat their shapes.
import type { InputOf, OutputOf } from '@example/client-sdk'
import type { ResourceOf } from '@example/client-sdk/react'

type UserInput = InputOf<typeof query.users.byId>
type User = OutputOf<typeof client.users.byId>
type UserResource = ResourceOf<typeof query.users.byId>

// The options factory preserves the same operation metadata.
type SameInput = InputOf<typeof query.users.byId.getOptions>
type SameResource = ResourceOf<typeof query.users.byId.getOptions>
```

The ClientSDKProvider receives the stable client at the composition root and exposes the derived query interface. `createClient`, `createQuery`, `ClientSDKProvider`, and `useQueryApi` are proposed owned APIs still to implement; Effect/TanStack do not ship these exact SDK helpers. The RPC operation inventory and its input/output types must remain automatic. The root client adds semantic adaptation without hand-registering every passthrough operation.

The complete runtime object returned by a factory is intentional. Publish that factory through a controlled ESM barrel; this is different from a static object registry that manually repeats exported functions. Public imports default to `@example/client-sdk` and `@example/client-sdk/react`; internal files stay blocked by the export map and import rules.

## 5. Add client semantics only where they help

```ts
// core/src/features/deployments/api/schema.ts
export const DeploymentStatus = Schema.Literal('queued', 'building', 'ready', 'failed')
export type DeploymentStatus = typeof DeploymentStatus.Type

// client-sdk/src/features/deployments/display.ts
import type { DeploymentStatus } from '@example/core/deployments/schema'

const display = {
  queued: { messageKey: 'deployment.queued', tone: 'neutral', order: 0 },
  building: { messageKey: 'deployment.building', tone: 'info', order: 1 },
  ready: { messageKey: 'deployment.ready', tone: 'positive', order: 2 },
  failed: { messageKey: 'deployment.failed', tone: 'danger', order: 3 },
} as const satisfies Record<DeploymentStatus, StatusDisplay>

export function getDisplayStatus(status: DeploymentStatus) {
  return display[status]
}

// client-sdk/src/index.ts — public export directly from the implementation
export * as Deployments from '#client-sdk/features/deployments/display'
```

`StatusDisplay` describes the additional semantic descriptor and belongs beside this helper, derived from its local runtime schema when exposed as data. It is not another copy of DeploymentStatus. The plain mapping object is data, not an exported function registry.

```tsx
// features/src/deployments/react/status.tsx
export function DeploymentStatusLabel({ status }: { status: DeploymentStatus }) {
  const descriptor = Deployments.getDisplayStatus(status)
  return (
    <Badge tone={descriptor.tone}>
      <Message id={descriptor.messageKey} />
    </Badge>
  )
}
```

Feature code selects layout. The SDK owns canonical status meaning; DS/localization supplies rendering. Streams follow the same rule: the client SDK's `features/chat/stream.ts` assembles validated transport events into immutable Message snapshots. Derive wire types from the API/schema, and do not handwrite a second transport client interface just to wrap one stream.

## 6. Query helpers derive automatically


Provider setup calls `setMutationDefaults(queryClient)` from `@example/client-sdk/react` once per constructed client. That single installer owns product invalidation and cache reconciliation; mutation hooks only consume the generated options. See [the installer and mutation hook](client-sdk.md#one-mutation-defaults-installer). Registration belongs in module-defined setup, never a render effect or each feature call site.

`useQueryApi` comes from the single `@example/client-sdk/react` public barrel. The nested names, payloads, and results follow the API. The proposed generic adapter supplies `getOptions`/`getMutationOptions` across eligible operations without per-route factories. Effect RPC does not ship this TanStack helper API; implement/select it once and verify inference. Read/mutation/stream semantics and invalidation belong in colocated operation policy, not a second endpoint registry.

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

`InputOf` and `ResourceOf` derive from the inferred query operation; callers do not declare another payload or manually combine query result generics. Components consume this feature-local hook or a context supplied by its provider. The hook returns the tracked result unchanged with an inferred `ResourceOf<UserRead>` type, leaving one place to change the data source. [Type-only resource projection](query-resources.md#one-owned-type-projection-no-runtime-mapper). If it becomes useful across independent products, move its single implementation to the SDK feature and export it through `client-sdk/react`; do not duplicate it. Query options still derive mechanically from the API. This is required for React server reads/mutations, not an optional alternative to effect-driven fetching. Live streams consume an SDK subscription adapter; their reconnect/ordering/cancellation policy stays in vanilla SDK code.

```tsx
// features/src/users/react/details.tsx — orchestration, with reusable content/state parts.
'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import { Stack } from '@example/design-system/react'
import { useUserById } from '#features/users/react/use-user-by-id'
import { UserDetailsContent } from '#features/users/react/details-content'
import { UserError } from '#features/users/react/error'
import { UserRefreshError } from '#features/users/react/refresh-error'
import { UserPending } from '#features/users/react/pending'
import { UserPaused } from '#features/users/react/paused'
import { UserNotRequested } from '#features/users/react/not-requested'

export function UserDetails({ id }: { id: InputOf<Query['users']['byId']>['id'] }) {
  const user = useUserById({ id })
  if (user.data !== undefined) {
    return (
      <Stack>
        <UserDetailsContent user={user.data} />
        {user.status === 'error' && <UserRefreshError error={user.error} />}
      </Stack>
    )
  }
  if (user.status === 'error') return <UserError error={user.error} />
  if (user.fetchStatus === 'fetching') return <UserPending />
  if (user.fetchStatus === 'paused') return <UserPaused />
  return <UserNotRequested />
}
```

`ResourceOf` is a type-only facade: returning the original observer result preserves property tracking. Do not spread it, eagerly read every field, or add a normalizing wrapper. Each imported part lives in its own file. `UserDetailsContent` accepts a resolved API-derived user and contains no query state branching. Error/pending/waiting parts compose the shared DS state components described in [UI states](ui-states.md); `UserRefreshError` is an inline notice. This view reads `fetchStatus` only to distinguish initial waiting states. An array response with `status === 'success'` and zero items renders the feature's Empty part; it is never initial loading. More elaborate workflow state machines remain useful when the workflow actually owns those states, as in the composer below.

```ts
// features/src/users/react/use-suspense-user-by-id.ts — explicit alternative
import type { InputOf } from '@example/client-sdk'
import { useQueryApi } from '@example/client-sdk/react'
import type { Query, SuspenseResourceOf } from '@example/client-sdk/react'
import { useSuspenseQuery } from '@example/libraries/query/react'

type UserRead = Query['users']['byId']

export function useSuspenseUserById(input: InputOf<UserRead>): SuspenseResourceOf<UserRead> {
  const query = useQueryApi()
  return useSuspenseQuery(query.users.byId.getOptions(input))
}
```

```tsx
// The boundary belongs above the component that calls the suspending hook.
<UserQueryErrorBoundary>
  <Suspense fallback={<UserPending />}>
    <SuspenseUserDetails id={id} />
  </Suspense>
</UserQueryErrorBoundary>
```

The Suspense variant guarantees defined data on return and requires error/reset integration. The generic options adapter must support that hook without conditional `enabled`, `skipToken`, or placeholder-data behavior. Do not toggle hook kinds with a boolean or use the old `suspense: true` query option. See [the version-specific Query contract](query-resources.md#suspense-is-an-explicit-alternative). The proposed type helpers/options adapter still need implementation and semantic typechecks.

## 7. A headless composer

```ts
// features/src/chat/composer/react/schema.ts
import { Schema } from '@example/libraries/effect'

export const DraftText = Schema.String
export type DraftText = typeof DraftText.Type

export const ComposerDraft = Schema.Struct({ text: DraftText })
export type ComposerDraft = typeof ComposerDraft.Type
export const ComposerDraftPatch = Schema.partial(ComposerDraft)
export type ComposerDraftPatch = typeof ComposerDraftPatch.Type

export const SubmitResult = Schema.Union(
  Schema.Struct({ kind: Schema.Literal('sent') }),
  Schema.Struct({ kind: Schema.Literal('rejected'), message: Schema.String }),
)
export type SubmitResult = typeof SubmitResult.Type

export const ComposerSubmission = Schema.Union(
  Schema.Struct({ kind: Schema.Literal('idle') }),
  Schema.Struct({ kind: Schema.Literal('submitting') }),
  Schema.Struct({ kind: Schema.Literal('failed'), message: Schema.String }),
)
export const ComposerMetaData = Schema.Struct({
  submission: ComposerSubmission,
  canSubmit: Schema.Boolean,
})
export type ComposerMetaData = typeof ComposerMetaData.Type

// contract.ts
import type { RefObject } from '@example/libraries/react'
import type { TextInputHandle } from '@example/design-system/react'

export interface ComposerContract {
  state: ComposerDraft
  meta: ComposerMetaData & { inputRef: RefObject<TextInputHandle | null> }
  actions: {
    patch(patch: ComposerDraftPatch): void
    replace(draft: ComposerDraft): void
    reset(): void
    submit(): Promise<SubmitResult>
  }
}
```

`patch` merges editable fields, `replace` supplies the complete draft, and `reset` restores the implementer-defined baseline. Public `state` contains the controllable draft. Submission lifecycle, errors, and derived `canSubmit` belong in `meta`, together with the input ref. `TextInputHandle` denotes the owned DS platform-neutral handle; refs are not JSON-schema data. The controller derives consistent metadata and rechecks eligibility when submitting. No draft action allows callers to overwrite metadata; all pass through the same controller validation. This version locks editing during submission. A product allowing continued typing needs a revision-aware contract/controller; do not clear a newer draft when an earlier send completes. The implementer derives submission eligibility from its domain operation: forwarding can permit an empty comment, whereas a new text message may require content or attachments. The shared button must not invent a nonempty-text rule. The controller handles reentrancy, validation, and normalization of send errors, even if the button is disabled.

```tsx
// features/src/chat/composer/react/context.tsx — React 19
'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { ComposerContract } from '#features/chat/composer/react/contract'

const Context = createContext<ComposerContract | null>(null)

export function useComposer(): ComposerContract {
  const value = use(Context)
  if (value === null) throw new Error('Composer.Provider is required')
  return value
}

export function ComposerProvider({ value, children }: {
  value: ComposerContract
  children: ReactNode
}) {
  return <Context value={value}>{children}</Context>
}
```

A provider receives a value; it does not require `chatId`, `isEditing`, or a specific data library. It is “smart” about its domain interface while ignorant of how the parent implements it.

```tsx
// features/src/chat/composer/react/input.tsx
'use client'

import { TextInput } from '@example/design-system/react'
import { useComposer } from '#features/chat/composer/react/context'

export function ComposerInput() {
  const { state, actions, meta } = useComposer()
  return (
    <TextInput
      ref={meta.inputRef}
      value={state.text}
      onChangeText={(text) => actions.patch({ text })}
      disabled={meta.submission.kind === 'submitting'}
      accessibilityLabel="Message"
    />
  )
}

// submit.tsx
export function ComposerSubmit() {
  const { actions, meta } = useComposer()
  return (
    <Button
      disabled={!meta.canSubmit}
      onPress={() => { void actions.submit() }}
    >
      <Button.Text>Send</Button.Text>
    </Button>
  )
}
```

The action contract resolves declared failures; its implementation must catch and normalize expected SDK failures. Do not use `void` to hide unhandled rejections. The production version renders `meta.submission.kind === 'failed'` through a composed Error part and uses the product's localization contract for labels.

```tsx
// frame.tsx
export function ComposerFrame({ children }: { children: ReactNode }) {
  return <Stack className="gap-2 rounded-xl p-3">{children}</Stack>
}

// index.ts — ESM public parts, no object registry
export { ComposerProvider as Provider, useComposer as use } from '#features/chat/composer/react/context'
export { ComposerFrame as Frame } from '#features/chat/composer/react/frame'
export { ComposerInput as Input } from '#features/chat/composer/react/input'
export { ComposerSubmit as Submit } from '#features/chat/composer/react/submit'
export { ComposerFooter as Footer } from '#features/chat/composer/react/footer'

// Consumer of the export-mapped ./chat/composer/react entry point
import * as Composer from '@example/features/chat/composer/react'
```

`export *` is also appropriate when each module already uses its intended public names. Both forms let callers dot into owned ESM namespaces without maintaining a monolithic object export. Bundle behavior still needs verification.

### Different implementers, same interface

```tsx
// features/src/chat/composer/react/existing-provider.tsx
export function ExistingComposerProvider({ chatId, children }: {
  chatId: ChatId
  children: ReactNode
}) {
  const value: ComposerContract = useExistingComposer({ chatId })
  return <Composer.Provider value={value}>{children}</Composer.Provider>
}

// features/src/chat/composer/react/new-provider.tsx
export function NewComposerProvider({ onCreated, children }: {
  onCreated(chatId: ChatId): void
  children: ReactNode
}) {
  const value: ComposerContract = useNewComposer({ onCreated })
  return <Composer.Provider value={value}>{children}</Composer.Provider>
}

// features/src/chat/composer/react/mock-provider.tsx — explicit fixed-state preview
export function MockComposerProvider({ value, children }: {
  value: ComposerContract
  children: ReactNode
}) {
  return <Composer.Provider value={value}>{children}</Composer.Provider>
}

const failedPreview = {
  state: { text: 'Please inspect this page' },
  meta: {
    submission: { kind: 'failed', message: 'Connection lost' },
    canSubmit: true,
    inputRef: { current: null },
  },
  actions: {
    patch() {},
    replace() {},
    reset() {},
    async submit() { return { kind: 'rejected', message: 'Preview only' } },
  },
} satisfies ComposerContract
```

The mocked actions are intentionally static preview behavior, not production fallbacks. `useExistingComposer` and `useNewComposer` are named implementer hooks still to implement; their signatures must conform and their controller behavior needs tests. A complete screen can be reviewed using these contracts before connecting the network.

### A sibling action outside the visual frame

```tsx
export function ForwardDialog() {
  return (
    <ForwardComposerProvider>
      <Dialog.Root>
        <Composer.Frame>
          <Composer.Input />
        </Composer.Frame>
        <ForwardPreview />
        <Dialog.Footer>
          <ForwardSubmit />
        </Dialog.Footer>
      </Dialog.Root>
    </ForwardComposerProvider>
  )
}

function ForwardSubmit() {
  const { actions } = Composer.use()
  return <Button onPress={() => { void actions.submit() }}><Button.Text>Forward</Button.Text></Button>
}
```

Visual nesting does not determine access; the provider boundary does. The forward controller implements the same composer contract, while this composition changes its visible affordances.

## 8. Panels, persistence, and identity

```ts
// features/src/chat/panels/react/contract.ts
export interface PanelsContract {
  state: PanelsState // schema-derived layout, widths, placement order
  actions: {
    resize(input: ResizePanelInput): void
    move(input: MovePanelInput): void
  }
}
```

A provider implementation can back this with memory, a persisted user preference, or per-chat storage. The components cannot tell which. Sharing `usePanelLayout` between provider implementations reuses behavior; putting one stable provider above routes retains actual mounted state.

```tsx
// features/src/chat/workspace/react/panels-provider.tsx
export function ChatWorkspacePanelsProvider({ workspaceKey, children }: {
  workspaceKey: string
  children: ReactNode
}) {
  const panels = useWorkspacePanels(workspaceKey)
  return <Panels.Provider value={panels}>{children}</Panels.Provider>
}

// features/src/chat/workspace/react/composer-provider.tsx
export function ChatWorkspaceComposerProvider({ session, children }: {
  session: ChatSessionController
  children: ReactNode
}) {
  const composer = useSessionComposer(session)
  return <Composer.Provider value={composer}>{children}</Composer.Provider>
}

// features/src/chat/workspace/react/index.tsx — composition only, no state subscriptions
export function ChatWorkspaceProvider({ session, children }: {
  session: ChatSessionController
  children: ReactNode
}) {
  return (
    <ChatWorkspacePanelsProvider workspaceKey={session.workspaceKey}>
      <ChatWorkspaceComposerProvider session={session}>
        {children}
      </ChatWorkspaceComposerProvider>
    </ChatWorkspacePanelsProvider>
  )
}
```

Each independently updating state hook belongs inside its corresponding provider wrapper. A panels-only local update does not rerun ChatWorkspaceProvider or its composer hook: the panels wrapper receives the existing composer subtree through `children`. Composer updates likewise stay with their own owner. This is structural isolation, not a reason to memoize a parent that owns both subscriptions.

Stable children allow React to reuse unaffected elements; consumers of a changed context, components with their own updates, and descendants receiving genuinely changed parent props can still render. Do not describe this as automatic shallow comparison of every ordinary component's props. [React's children-wrapper guidance](https://react.dev/reference/react/memo).

The session controller has a schema-defined lifecycle such as draft → creating → active. The provider component types and their parent positions remain stable while its value changes. Keep the input and scroll container at stable positions too if they must retain identity; replacing a route subtree can still remount them. Validate this against actual navigation. Separate new/existing providers are useful for independent initial compositions, not a blanket prescription for swapping live ancestors.

## 9. One DS contract, two host implementations

```ts
// design-system/src/button/react/contract.ts
import type { ReactNode } from '@example/libraries/react'

export interface ButtonProps {
  children: ReactNode
  onPress(): void
  disabled?: boolean
  className?: string
  accessibilityLabel?: string
}
```

```tsx
// design-system/src/button/react/index.tsx — default web adapter
import type { ButtonProps } from '#design-system/button/react/contract'

export function Button({ children, onPress, disabled, className, accessibilityLabel }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={className}
      aria-label={accessibilityLabel}
    >
      {children}
    </button>
  )
}
```

```tsx
// design-system/src/button/react/index.native.tsx — native adapter owns RN dependency
import { Pressable } from 'react-native'
import type { ButtonProps } from '#design-system/button/react/contract'

export function Button({ children, onPress, disabled, className, accessibilityLabel }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={className}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  )
}
```

The native Tailwind adapter supplies `className` support/types. Each platform must also implement focus/pressed/hover styling, accessible semantics, and content constraints as needed; this small example does not finish a DS. `Button.Text` would be a separate text part appropriate to both hosts. Raw text children acceptable on web are not automatically acceptable inside native View-like elements.

```tsx
// features/src/chat/computer/react/contract.ts — no HTMLIframeElement or WebView props
export interface ComputerViewProps {
  session: ComputerSession // schema-derived safe view capability, not VM credentials
  onUnavailable(reason: ComputerUnavailable): void
}

// Feature composition consumes an owned embed below its public contract.
export function ComputerView() {
  const { state, actions } = Computer.use()
  return <ComputerEmbed session={state.session} onUnavailable={actions.reportUnavailable} />
}
```

ComputerEmbed's web adapter owns iframe behavior and its native adapter owns a webview or alternative view. If capabilities differ, represent that in the session/view contract and choose an explicit available/unavailable composition; do not pretend every platform supports the same host primitive.

## 10. Routing adapters and optional prefetch

```tsx
// features/src/chat/selection/react/context.tsx — portable value/promise contract
'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { Client, InputOf } from '@example/client-sdk'

type ChatId = InputOf<Client['chat']['byId']>['id']
const ChatIdContext = createContext<ChatId | Promise<ChatId> | null>(null)

export function ChatIdProvider({ value, children }: {
  value: ChatId | Promise<ChatId>
  children: ReactNode
}) {
  return <ChatIdContext value={value}>{children}</ChatIdContext>
}

export function useChatId(): ChatId {
  const value = use(ChatIdContext)
  if (value === null) throw new Error('ChatIdProvider is required')
  return typeof value === 'string' ? value : use(value)
}
```

The provider passes a value or stable promise without unwrapping it. `useChatId` suspends at its consumer. A server promise is a snapshot, not a subscription to later history writes. Do not inject hook functions through context or create a new promise on every client render.

```tsx
// features/src/chat/react/chat-messages-for-id.tsx — reusable React composition
'use client'

import type { Client, InputOf } from '@example/client-sdk'
import { ChatIdProvider } from '#features/chat/selection/react/context'
import { ChatMessages } from '#features/chat/messages/react'

type ChatId = InputOf<Client['chat']['byId']>['id']

export function ChatMessagesForId({ id }: { id: ChatId }) {
  return <ChatIdProvider value={id}><ChatMessages /></ChatIdProvider>
}
```

```tsx
// features/src/chat/next/route-chat-messages.tsx — only the Next route binding
'use client'

import { useRouteChatId } from '#features/chat/next/use-route-chat-id'
import { ChatMessagesForId } from '#features/chat/react/chat-messages-for-id'

export function RouteChatMessages() {
  const id = useRouteChatId()
  return <ChatMessagesForId id={id} />
}
```

```tsx
// Next composition: the potentially suspending route hook runs below this boundary.
<ChatShell>
  <Suspense fallback={<ChatMessagesPending />}>
    <RouteChatMessages />
  </Suspense>
</ChatShell>
```

`ChatMessagesForId` is reusable from a modal, Electron view, or resolved route with a supplied ID. Only the hook binding belongs in Next; its indirect framework dependency still counts. Name files after their actual export responsibility, not the example domain they were copied from. `useRouteChatId` statically calls owned Next navigation and validates the ID using the API schema. That behavior lives in the hook; the component only composes. A modal supplies its local selection to the same portable provider. Route readers stay near their consumers rather than moving to a global provider. [Routing variants and event-time history updates](platforms.md#route-reads-suspend-where-they-are-consumed) cover the promise projection option and production checks still required.

```tsx
// apps/web/app/chat/[id]/page.tsx — thin entry point
export { ChatPage as default } from '@example/features/chat/next'
```

```tsx
// features/src/chat/next/existing-page.tsx — one route composition
import { ResolvedChatPage } from '#features/chat/next/resolved-existing-page'
export function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ChatPageShell>
      <Suspense fallback={<ChatPagePending />}>
        <ResolvedChatPage params={params} />
      </Suspense>
    </ChatPageShell>
  )
}

// features/src/chat/next/resolved-existing-page.tsx — separate server integration module
import { Prefetch } from '@example/client-sdk/rsc'

export async function ResolvedChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Prefetch
      client={queryClient}
      queryApi={queryApi}
      reportSetupError={reportPrefetchSetupError}
      query={async ({ client, query }) => {
        void client.prefetchQuery(query.chat.byId.getOptions({ id }))
        void client.prefetchQuery(query.chat.messages.getOptions({ chatId: id }))
        void client.prefetchQuery(query.computer.byChatId.getOptions({ chatId: id }))
      }}
    >
      <ExistingChatProvider chatId={id}>
        <ExistingChatScreen />
      </ExistingChatProvider>
    </Prefetch>
  )
}
```

`Prefetch` is a proposed shared server-only convenience owned by `client-sdk/rsc`, not a TanStack export. It receives an async preparation callback with the QueryClient (`client`) and the inferred product query helpers (`query`), so one boundary can register several prefetches. Pages do not repeat authentication/client construction, domain query factories, or QueryClient setup. Real route IDs are decoded at this boundary with their owner schema.

Implement provider mounting and hydration by reading the official [TanStack Advanced Server Rendering guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr). The [platform reference](platforms.md) records the correct provider lifetime and a version-specific illustrative example. That official integration is authoritative; these architectural sketches do not replace it.

The host request integration supplies `queryClient`, `queryApi`, and `reportPrefetchSetupError` with the correct request/identity scope; these names denote that integration, not globals. The helper accepts these handles without importing an app. The host can bind them once behind its integration entry point to keep page calls short. It invokes the preparation callback without awaiting it; the callback registers each query synchronously with `void client.prefetchQuery(...)`, then the helper dehydrates pending promises. The callback must not await before registration. Async key prerequisites resolve only in a child beneath Suspense, as above, never at the top-level shell. HydrationBoundary receives that exact client's state. The callback stays server-side; `client` here is the QueryClient, not the root product SDK client. Preserve auth/cache isolation and normal error handling. Remove the helper and the same feature still fetches through the ordinary SPA hook.

```tsx
// SPA/desktop: identical portable feature under the ordinary owned app provider
<AppProvider>
  <ExistingChatProvider chatId={chatId}>
    <ExistingChatScreen />
  </ExistingChatProvider>
</AppProvider>
```

Native mounts its own documented Query provider/persistence implementation. The internal inferred API and feature contracts stay the same.

## 11. Execution is a capability, supplied once

```ts
// core/src/features/execution/contract.ts
import type { Run, Event } from '#core/features/execution/api/schema'

export type Execution = {
  run(input: typeof Run.Type, options: { signal: AbortSignal }): AsyncIterable<typeof Event.Type>
}
```

```ts
// Trusted CLI composition: transport and execution location are independent.
import { createClient } from '@example/client-sdk'
import { startWorker } from '@example/core/execution'
import { createLocalExecution } from '@example/core/execution/node'

await using client = createClient({ baseUrl, credentials: workerCredentials })
await using execution = createLocalExecution({ workspace: approvedWorkspace })
await using worker = await startWorker({ client, execution })
await worker.closed
```

The same worker accepts `createSandboxExecution({ sandbox: assignedSandbox })` from the owned sandbox entry point. `Run` and `Event` have one feature API schema owner. The host authenticates and authorizes assignments before execution; mobile clients cannot grant themselves local shell access. These proposed handles implement `Symbol.asyncDispose`; the host owns their lifetime. [The runtime example](runtimes.md) defines the actual schema sketch, lifecycle requirements, and server/client separation without prescribing one vendor.

## 12. Recognizable failures

```tsx
// Reject: feature knows framework and vendor protocol.
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
return <div>{status === 'ready' ? 'Ready' : 'Failed'}</div>
```

```tsx
// Reject: different product workflows hidden behind mode booleans.
<ChatScreen isNewChat={false} isNative isForwarding={false} />
```

```tsx
// Reject: successful empty and unresolved data collapsed.
if (!data || data.length === 0) return <Skeleton />
```

```ts
// Reject: wholesale vendor surface disguised as ownership.
export * from 'some-virtualizer'
export type LinkProps = ComponentProps<typeof NextLink>
```

```ts
// Reject: server-rendered consumer bypasses the API contract.
const user = await usersDb.getById(id)
```

```tsx
// Reject: live parent type switch silently resets retained state.
return isCreated
  ? <ExistingProvider><Composer.Input /></ExistingProvider>
  : <NewProvider><Composer.Input /></NewProvider>
```

The last example is wrong when retention is required, not proof that distinct providers are bad. Place stable ownership above the transition or persist/restore what needs to survive.

Review each real vertical slice against concrete substitutions:

- Same composer parts inside a page and a forward dialog, using different implementers.
- Same chat feature in a client-only web app and an RSC host, with identical data contract.
- Same domain helpers through generated HTTP and inferred RPC adapters where supported.
- Same Button contract with web and native host implementations, no native imports in the web bundle.
- Empty-success and refresh-error previews visibly distinct from initial loading.
- An attempted cross-tenant service call rejected even from an internal API route.
- A canceled stream releases the transport and never mutates previously emitted snapshots.

These substitutions are the evidence for portability and composition. The folder names alone are not.
