# Code recipes for the rules

Use this alongside the skill instructions. Each recipe makes one rule visible at the call site or ownership boundary. Absolute `#<package>/*` paths denote configured package-private imports, not public exports; see [boundaries](boundaries.md#import-policy). These are architecture sketches using proposed owned package APIs, not a runnable application. Effect-specific declarations follow the v3 family documented in [contracts and backend](contracts-backend.md); product factories, query helpers, and host adapters still need implementation. The separate executable fixture verifies selected pure behaviors only.

## 1. Write the consumer before the implementation

```tsx
// The tree is the design. Parts can initially have minimal visual internals.
<ExistingComposerProvider chatId={chatId}>
  <Composer.Frame>
    <Composer.Input />
    <Composer.Footer>
      <Composer.Attachments />
      <Composer.Submit />
    </Composer.Footer>
  </Composer.Frame>
</ExistingComposerProvider>
```

```ts
// The desired plain-JS product interface guides implementation below it.
await using client = createClient({ baseUrl })
const user = await client.users.byId({ id })
```

Design these contracts from the consumer inward, then implement the [vertical slice from core outward](build-sequence.md): core declarations and behavior → API binding → inferred RPC/complete SDK → React data integration → feature/host composition. A feature should not first be built around a vendor's internal types and then renamed to look owned. The same sequence applies when adding a feature to an existing product; reuse unchanged layers.

## 2. Vanilla roots and explicit framework folders

```text
rpc/src/
  index.ts               # plain transport/types
  react/
    index.ts             # explicit public barrel
    provider.tsx         # React implementation
api/src/
  index.ts               # vanilla Fetch handler + Api type
  rpc/index.ts           # client-safe runtime schema group
  next/index.ts          # Next integration
  bun/index.ts           # Bun integration
client-sdk/src/
  index.ts               # createClient + consumer types
  react/
    index.ts             # createQuery, ClientSDKProvider, useQueryApi
    query.ts
    provider.tsx
```

```ts
// Allowed: explicit consumption choice.
import { createClient } from '@example/client-sdk'
import { RpcProvider } from '@example/rpc/react'
import { handler } from '@example/api/next'

// Rejected: React leaking from a vanilla root.
import { RpcProvider } from '@example/rpc'
```

The same rule covers UI libraries: `design-system/react` for components, vanilla root for tokens, and `features/chat/react` for React feature composition. A `.native.tsx` implementation can still resolve behind the explicit React barrel.

## 3. Package exports and optional peers

```json
{
  "name": "@example/client-sdk",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js"
    }
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }
  }
}
```

This partial manifest illustrates the entry points and optional peer policy; choose/test supported ranges and supply actual dependency/build fields. A vanilla consumer needs no React installation. A consumer of `./react` supplies its compatible React peer. Optional metadata does not fix a root barrel that eagerly imports React. [npm optional peers](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#peerdependenciesmeta).

```ts
import { createClient } from '@example/client-sdk' // public
import { createQuery } from '@example/client-sdk/react' // public

// Block all of these, including aliases/relative paths resolving here:
import { createClient } from '@example/client-sdk/src/client'
import { assemble } from '@example/client-sdk/features/chat/stream'
import { assemble } from '../../client-sdk/src/features/chat/stream'
```

The export map restricts normal package subpaths. A resolved import rule is also needed for monorepo source/alias bypasses. Public exports are a consumption boundary, not a security sandbox. [Node package entry points](https://nodejs.org/api/packages.html#package-entry-points).

For `api/next`, apply the same optional-peer policy to the Next adapter where it owns that dependency. For `api/bun`, document the Bun runtime requirement; do not assume that declaring a peer named `bun` installs the runtime. A vanilla root import and its `.d.ts` must resolve without either framework.

## 4. Barrels publish modules; factories construct instances

```ts
// client-sdk/src/index.ts
export { createClient } from '#client-sdk/client'
export type { Client, ClientOptions } from '#client-sdk/client'

// client-sdk/src/react/index.ts
export { createQuery } from '#client-sdk/react/query'
export { ClientSDKProvider, useQueryApi } from '#client-sdk/react/provider'
```

```ts
// features/src/chat/composer/react/index.ts — only owned public component modules
export { ComposerFrame as Frame } from '#features/chat/composer/react/frame'
export { ComposerInput as Input } from '#features/chat/composer/react/input'
export { ComposerSubmit as Submit } from '#features/chat/composer/react/submit'

// Exposed directly by the package export map as ./chat/composer/react.
```

```tsx
import * as Composer from '@example/features/chat/composer/react'

<Composer.Frame>
  <Composer.Input />
  <Composer.Submit />
</Composer.Frame>
```

Keep this as the single consumed barrel; do not forward it through another folder or feature barrel. Use `export *` when an implementation module contains only deliberately public names. Avoid a second `export const Composer = { ... }` registry. A runtime object returned by `createClient()` is valid; it represents one configured product instance. Namespace syntax still needs a bundle check for dynamic access and side effects.

## 5. Own third-party imports once

```ts
// libraries/query/react/index.ts — the approved vendor owner
export { useQuery, useMutation } from '@tanstack/react-query'

// A feature imports owned APIs only.
import { useQuery } from '@example/libraries/query/react'
import { useQueryApi } from '@example/client-sdk/react'
```

```ts
// Rejected in a feature:
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

// Rejected in a dependency facade:
export * from 'some-virtualizer'
```

Named re-exports are enough when adopting those exact primitives is intentional. Narrow a vendor's props/behavior when its full surface would become the product contract.

## 6. Colocate by feature

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
// users/service.ts
import type { GetById } from '#core/features/users/api/schema'
import { UsersDb } from '#core/features/users/db'
```

```text
Rejected organization:
  contracts/users.ts
  services/users.ts
  databases/users.ts
```

A local `schema.ts` is not a global contracts bucket. A real generic `rpc/react` integration is an integration capability, not a collection of unrelated feature hooks.

## 7. Infer types from the runtime owner

```ts
// users/api/schema.ts
import { Schema } from '@example/libraries/effect'

export const GetById = Schema.Struct({ id: Schema.String })
export const User = Schema.Struct({ id: Schema.String, name: Schema.String })
export type User = typeof User.Type
```

```ts
// users/service.ts — no second GetUserInput interface
import type { GetById } from '#core/features/users/api/schema'

export class UsersService {
  static getById(input: typeof GetById.Type) {
    return authorizedLookup(input)
  }
}
```

`authorizedLookup` denotes the domain implementation, not a library method. Distinct persistence/public/UI schemas are valid when their shapes differ; duplicate copies of the same wire User are not.

## 8. Separate wire declaration from mounted API

```ts
// users/api/rpc.ts — runtime wire contract
export const UsersRpc = RpcGroup.make(
  Rpc.make('users.byId', {
    payload: GetById,
    success: User,
    error: Unavailable,
  }),
)

// users/api/index.ts — binds the authorized service for the server
import { UsersRpc } from '#core/features/users/api/rpc'
import { UsersService } from '#core/features/users/service'

export const UsersApi = UsersRpc.toLayer({ 'users.byId': UsersService.getById })
```

The group alone is a contract. The feature API binds behavior; the root host supplies the live dependencies and mounts the combined APIs. This preserves schema → DB → service → API without forcing implementation code into a client-readable declaration.

## 9. Type-only server imports and intentional runtime codecs

```ts
// api/src/index.ts — server barrel
import type { ApiRpc } from '@example/api/rpc'
export type Api = typeof ApiRpc
export { handler, dispose } from '#api/server'

// rpc's type declaration
import type { Api } from '@example/api'
import type { RpcClient } from '@example/libraries/effect/rpc'

export type Rpc = RpcClient.FromGroup<Api>
```

```ts
// RPC implementation: a different, explicitly client-safe barrel.
import { ApiRpc } from '@example/api/rpc'
import { RpcClient } from '@example/libraries/effect/rpc'

const acquire = RpcClient.make(ApiRpc)
```

The server import is erased. Effect's runtime schema group is intentionally present for codecs and contains no handlers/DB/auth implementation. A type import cannot be passed as a runtime value. Do not write `import { Api }` from the server root in client source. [Effect RPC client](https://github.com/Effect-TS/effect/blob/v3/packages/rpc/src/RpcClient.ts).

```json
{
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true
  }
}
```

Use a matching type-import lint rule and browser dependency-graph check. Compiler settings alone do not prove that the supposedly safe runtime barrel excludes server implementation.

## 10. Expose the whole product from one root client

```ts
import { createClient } from '@example/client-sdk'

const client = createClient({ baseUrl })
const user = await client.users.byId({ id })

for await (const message of client.chat.sendMessage(input, { signal })) {
  consumeMessage(message)
}

```

This is the proposed SDK lifecycle, including `Symbol.asyncDispose` on the owned handle. The factory constructs one managed instance; the underlying scoped Effect client and transports are owned there. Ordinary API methods are inferred automatically; only semantic adapters add handwritten behavior. A consumer should not create separate user/chat clients.

## 11. Derive one query interface

```ts
import { createClient } from '@example/client-sdk'
import { createQuery } from '@example/client-sdk/react'

const client = createClient({ baseUrl })
const query = createQuery(client)

const options = query.users.byId.getOptions({ id })
void queryClient.prefetchQuery(options) // pinned Query version's method
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

The same generic integration derives every operation's input/output and mechanical key/function. Read/mutation/stream and invalidation policy still belong beside the original operation. `getOptions` is the proposed owned spelling, not an Effect built-in.

## 12. Inject once at the composition root

```tsx
// apps/web/app/providers.tsx; both instances have app-owned stable lifetimes.
<QueryClientProvider client={queryClient}>
  <ClientSDKProvider client={sdkClient}>{children}</ClientSDKProvider>
</QueryClientProvider>
```

```tsx
// Lower-level consumers can choose the transport integration directly.
import { RpcProvider } from '@example/rpc/react'

<RpcProvider rpc={rpc}>{children}</RpcProvider>
```

These are alternative abstraction levels, not a requirement to stack every provider. SDK ClientSDKProvider may internally compose the RPC provider if needed. Request identity and credential-bearing instances are never process-global server state. React Query mounting follows its official host guide.

## 13. Service authorizes; DB applies scope

```ts
// users/service.ts — inferred Effect return type
export class UsersService {
  static getById(input: typeof GetById.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireUserRead(actor, input.id)
      const db = yield* UsersDb
      const record = yield* db.findById({ id: input.id, scope })
      return { id: record.id, name: record.name }
    })
  }
}
```

The service module exports only `UsersService`; API bindings call `UsersService.getById`. Static methods return Effects whose dependencies are supplied by the host, with no mutable request state on the class. This consumption boundary deliberately accepts a possible method-level tree-shaking cost. [Service export convention](contracts-backend.md#one-named-service-export).

DB has no credential resolver or policy decision. Its query uses the supplied tenant/resource scope. The host establishes identity before the service runs; passing a shape-valid actor from untrusted JSON is not authentication. The full service example still requires its live dependencies/error mapping.

## 14. Keep product meaning in the SDK

```ts
// client-sdk/src/features/deployments/display.ts
export function getDisplayStatus(status: DeploymentStatus) {
  return statusDisplay[status]
}
```

```tsx
// Feature renders the canonical descriptor through owned UI.
const display = getDisplayStatus(deployment.status)
return <Badge tone={display.tone}><Message id={display.messageKey} /></Badge>
```

`statusDisplay` is exhaustive over the schema-derived enum. It owns canonical tone/order/message keys; the feature does not reconstruct that map. Its helper is published through an approved SDK public barrel. The root stays vanilla, so descriptors contain semantic tokens rather than React components.

## 15. Hide stream assembly below features

```ts
// Consumer receives whole immutable messages.
for await (const message of client.chat.sendMessage(input, { signal })) {
  messages.accept(message)
}
```

```ts
// Rejected in feature code:
const event = JSON.parse(rawChunk)
const nextMessage = applyJsonPatch(previousMessage, event.patch)
```

Validation, framing/assembly, ordering, cancellation, and terminal failures belong to the owned transport/client SDK layers. Derive event types from the owner schema; do not re-declare stream DTOs in the UI.

## 16. State explicitly distinguishes loading and empty

```tsx
switch (state.kind) {
  case 'awaiting':
    return <Awaiting state={state} />
  case 'failed':
    return <LoadError error={state.error} />
  case 'empty':
    return <Empty refresh={state.refresh} />
  case 'content':
    return <Items items={state.users} refresh={state.refresh} />
}
state satisfies never
return null
```

```tsx
// Rejected: a valid empty response is not initial loading.
if (!data || data.length === 0) return <Skeleton />
```

Each substantial state presentation is independently composable; `Awaiting` exhaustively dispatches its owned activity variants to pending/waiting parts. Follow the switch with `state satisfies never` and `return null`; do not add a catch-all default or runtime-throwing `assertNever`. Missing variants must fail typechecking, and unknown external values must become typed failures at the boundary. See [workflow dispatch](ui-states.md#exhaustive-workflow-dispatch). This is an explicit workflow-state example, not the default wrapper for query results. Its state schema lives beside the owning feature/hook. Ordinary query hooks return the original tracked result with a type-only `ResourceOf` facade; see [the hook and optional Suspense examples](examples.md#6-query-helpers-derive-automatically). Retain data on refresh failure. The legacy executable fixture checks the pure workflow state table.

## 17. Headless contracts and explicit mock implementers

```tsx
const value = {
  state: previewState,
  actions: previewActions,
  meta: previewMeta,
} satisfies ComposerContract

const preview = (
  <Composer.Provider value={value}>
    <Composer.Input />
    <Composer.Submit />
  </Composer.Provider>
)
```

```ts
// Contract uses schema-derived state, plus real callable capabilities.
// Draft/patch and serializable metadata derive from their schemas; see the composer example.
// RefObject and TextInputHandle come from owned React/DS entry points.
// Submission lifecycle and canSubmit are meta, never patchable state.
interface ComposerContract {
  state: ComposerDraft
  meta: ComposerMetaData & { inputRef: RefObject<TextInputHandle | null> }
  actions: {
    patch(patch: ComposerDraftPatch): void
    replace(draft: ComposerDraft): void
    reset(): void
    submit(): Promise<typeof SubmitResult.Type>
  }
}
```

The same parts consume an existing-chat, new-chat, forward, or explicit mock implementation. JSON schemas describe data, not React refs or function bodies. Missing providers fail clearly rather than inventing no-op production behavior.

## 18. Compose workflows instead of mode flags

```tsx
<ForwardComposerProvider>
  <Composer.Frame><Composer.Input /></Composer.Frame>
  <ForwardPreview />
  <Dialog.Footer><ForwardSubmit /></Dialog.Footer>
</ForwardComposerProvider>
```

```tsx
// Rejected:
<Composer isForwarding isNewChat={false} isNative={false} />
```

Sibling actions can use the context outside the visual frame. Submission eligibility comes from the implementation; a forward action may allow an empty comment. Ordinary `disabled` and accessibility booleans remain appropriate.

## 19. Keep identity where retention is required

```tsx
// Persistent layout owns provider and the actual input across route changes.
<SessionComposerProvider session={session}>
  <ConversationViewport>{routeContent}</ConversationViewport>
  <Composer.Frame>
    <Composer.Input />
    <Composer.Submit />
  </Composer.Frame>
</SessionComposerProvider>
```

```tsx
// Rejected when the draft/focus must survive this transition:
return created
  ? <ExistingProvider><Composer.Input /></ExistingProvider>
  : <NewProvider><Composer.Input /></NewProvider>
```

Use distinct providers for independent compositions. Use stable provider/ancestor/input identity or explicit persistence for transitions requiring retained state. Test the actual router boundary.

## 20. Shared props, web and native implementations

```ts
// button/contract.ts — imported by implementations, not a vanilla root barrel
export interface ButtonProps {
  children: ReactNode
  onPress(): void
  disabled?: boolean
}
```

```tsx
// button/index.tsx — web implementation behind design-system/react
export function Button({ children, onPress, disabled }: ButtonProps) {
  return <button type="button" onClick={onPress} disabled={disabled}>{children}</button>
}

// button/index.native.tsx — native implementation behind the same React barrel
export function Button({ children, onPress, disabled }: ButtonProps) {
  return <Pressable onPress={onPress} disabled={disabled}>{children}</Pressable>
}
```

These minimal bodies illustrate host ownership; production DS adds styling/accessibility and native text constraints. Native imports stay in the native DS implementation. Shared callers import `Button` from `design-system/react`, never DOM/RN primitives.

## 21. Routing is injected through feature integration

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
// The route hook is below the boundary, not inside an app-wide provider.
<ChatShell>
  <Suspense fallback={<ChatMessagesPending />}>
    <RouteChatMessages />
  </Suspense>
</ChatShell>
```

`ChatMessagesForId` is reusable from a modal, Electron view, or resolved route with a supplied ID. Only the hook binding belongs in Next; its indirect framework dependency still counts. Name files after their actual export responsibility, not the example domain they were copied from. `useRouteChatId` statically calls owned navigation hooks and decodes the feature ID. A modal provides its local value through the same portable context. The context may also carry a stable server promise and unwrap it at `useChatId`'s call site; that snapshot is not a live history subscription. Do not inject custom hooks through context. See [the complete routing example](examples.md#10-routing-adapters-and-optional-prefetch) and [platform constraints](platforms.md#route-reads-suspend-where-they-are-consumed).

## 22. Follow the official Next Query mounting recipe

Mount this once at the application root, above routes/features. All feature context providers consume its shared browser cache; do not copy this factory/provider into each feature. Server QueryClients remain request-isolated. See [cache versus observer ownership](react.md#one-app-cache-many-feature-observers).

```tsx
// apps/web/app/providers.tsx — minimal Query-only setup; add SDK context here when needed.
'use client'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

```tsx
// Shared SDK RSC helper; host request integration supplies scoped handles.
import { Prefetch } from '@example/client-sdk/rsc'
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
```

Keep Prefetch synchronous: invoke the callback without awaiting, register queries before the callback yields, and dehydrate pending promises. Never await at the top-level RSC shell; resolve required keys beneath local Suspense.

Read the official [TanStack Advanced Server Rendering guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr) for provider construction and hydration. [Our platform reference](platforms.md) records the version-matched factory example. Prefetch/dehydrate must use the same cache; the browser client survives initial suspension; server request identity is isolated. Removing Prefetch must preserve correct SPA behavior.

## 23. Publish through explicit host adapters

```ts
// Next app mount — a plain re-export from the approved adapter barrel.
export { GET, POST } from '@example/api/next'
```

```ts
// Bun application mount — host runtime setup stays behind its own adapter.
import { start } from '@example/api/bun'

const server = start({ port: 3000 })
```

These are proposed owned host exports. The adapter must implement the correct methods, auth, runtime dependencies, and lifecycle around the same composed API. A generic Fetch host can consume the vanilla API handler directly. No app re-declares a user/chat route or bypasses authorization through DB imports.

## 24. Check the consumption boundary, not just the source layout

```ts
// This must work in a test consumer without React/Next installed:
import { createClient } from '@example/client-sdk'

await using client = createClient({ baseUrl })

// Adding one API operation must make this infer without editing the client:
await client.users.byId({ id })

// Invalid payloads should fail static checking and boundary validation.
// @ts-expect-error byId takes a string ID in this example
client.users.byId({ id: 123 })
```

Acceptance also checks root `.d.ts` dependencies, illegal deep imports, server implementation exclusion, optional-peer adapters, typed failures, stream cancellation, and UI state transitions. These snippets describe future acceptance tests; they are not evidence that the full product or generic adapters have already been built.


## 25. Each provider owns its own state hook

These are feature context providers beneath the shared app QueryClientProvider. Splitting subscription owners never requires splitting Query caches.

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

```tsx
// Rejected: either hook updating reruns both hooks and recreates both providers.
function ChatWorkspaceProvider({ session, children }: ChatWorkspaceProviderProps) {
  const panels = useWorkspacePanels(session.workspaceKey)
  const composer = useSessionComposer(session)
  return <Panels.Provider value={panels}>
    <Composer.Provider value={composer}>{children}</Composer.Provider>
  </Panels.Provider>
}
```

Use `ChatWorkspaceProvider` because this is a headless provider composition. Name its props `ChatWorkspaceProviderProps`; use a visual role such as `ChatWorkspaceScreen` for a component that owns application layout.

Keep composition free of these subscriptions. Provider wrappers reuse their supplied children on their own updates. Changed-context consumers and genuine parent/own-state changes still render; this is not a blanket guarantee that nested providers never rerender. See [the React rule](react.md#one-state-owner-per-provider-wrapper).

## 26. Put public schemas in the owning feature's API area

```text
core/src/features/users/
  api/
    schema.ts     # one runtime input/output/error definition
    rpc.ts        # operation declaration uses those schema objects
    index.ts      # authorized service binding
  db.ts
  service.ts
```

```ts
// users/service.ts — import the schema leaf, not the binding barrel.
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
// users/api/index.ts — the only transport-to-service binding.
import { UsersRpc } from '#core/features/users/api/rpc'
import { UsersService } from '#core/features/users/service'

export const UsersApi = UsersRpc.toLayer({ 'users.byId': UsersService.getById })
```

Runtime objects, inferred static aliases, and wire encodings can differ when the schema declares a transformation. Derive the appropriate representation with the schema library's helpers. Do not manually redefine `GetByIdInput` in RPC, SDK, and query packages. UI-only state and function capabilities are owned separately because they represent different contracts.

## 27. Build another client from the same SDK

```ts
// CLI feature: it needs no React or original app source.
import { createClient } from '@example/client-sdk'

const client = createClient({ baseUrl })
try {
  const user = await client.users.byId({ id })
  printUser(user)
} finally {
  await client.dispose()
}
```

```ts
// features/src/users/use-user.ts — the feature data-source boundary.
import type { InputOf } from '@example/client-sdk'
import { useQueryApi } from '@example/client-sdk/react'
import { useQuery } from '@example/libraries/query/react'

import type { Query, ResourceOf } from '@example/client-sdk/react'

type UserRead = Query['users']['byId']

function useUser(input: InputOf<UserRead>): ResourceOf<UserRead> {
  const query = useQueryApi()
  return useQuery(query.users.byId.getOptions(input))
}
```

The hook returns the tracked result unchanged under an [inferred `ResourceOf<UserRead>` type](query-resources.md#one-owned-type-projection-no-runtime-mapper). Components cannot access the entire vendor surface through that public type; no eager normalization reads properties for them. See [feature hook and provider examples](react.md#components-consume-hooks-hooks-adapt-the-sdk). A Swift SDK derives wire types from the same API publication; any thin semantic helpers use the same golden fixtures. An MCP adapter projects approved operations and identity into MCP's protocol without copying payload schemas. One API evolves all these consumption paths.

## 28. Test a package as an external consumer

```json
{
  "name": "@example/client-sdk",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./react": { "types": "./dist/react/index.d.ts", "import": "./dist/react/index.js" }
  }
}
```

This is an export/files fragment, not a complete publishable manifest. Add the real version and dependencies plus optional peer metadata from recipe 3. Packed declarations cannot rely on unpublished workspace aliases.

```ts
// Isolated consumer: all installed artifacts resolve by package name.
import { createClient } from '@example/client-sdk'
import { createQuery } from '@example/client-sdk/react'
```

```ts
// Blocked even when monorepo path resolution happens to allow it:
import { createClient } from '@example/client-sdk/src/client'
import { UsersService } from '../../packages/core/src/features/users/service'
```

Use a packed artifact in a temporary consumer, without the monorepo's aliases. Verify its root separately with React/Next absent. This tests publishability without publishing anything to npm.

## 29. Inject where tools run

```ts
// Trusted local worker host: the implementation conforms to one capability.
import type { Execution } from '@example/core/execution'
import { startWorker } from '@example/core/execution'
import { createLocalExecution } from '@example/core/execution/node'

await using execution = createLocalExecution({
  workspace: approvedWorkspace,
}) satisfies Execution
await using worker = await startWorker({ client, execution })
await worker.closed
```

The factories return owned disposable handles in this proposed API. The worker consumes the same `Execution` contract for local or sandbox execution; its data types derive from the API schema. Dispatch validates the task and resolves its workspace scope before invoking execution. The host supplies a local implementation or a sandbox implementation; a WebSocket is just the worker's connection to orchestration. See [full runtime examples](runtimes.md#bind-execution-at-the-host) for acquisition/disposal and the API-owned task schema.

## 30. Check type safety and speed together

```ts
import { createClient } from '@example/client-sdk'

const client = createClient({ baseUrl })
const user = await client.users.byId({ id: 'user-1' })

// @ts-expect-error — inferred API input is a string ID.
await client.users.byId({ id: 123 })

// The implementation must not hide a lost type behind `as User` or `any`.
const name: string = user.name
```

```sh
# Run in the representative SDK consumer fixture, with its pinned toolchain.
tsc --noEmit --extendedDiagnostics
```

Run negative type tests as compilation fixtures, not requests against production. Record typecheck cost as the operation count and consumer surface grow; measure editor completion/navigation too. Separately measure startup, bundle size, per-call cost, and streaming memory. Set budgets after establishing a baseline. Optimize generic inference, entry-point graphs, and runtime lifetimes while keeping the same validated public contract.

## 31. Register mutation policy once

```ts
// Module-defined provider factory; invoked once per owned client lifetime.
import { makeQueryClient } from '@example/libraries/query/react'
import { setMutationDefaults } from '@example/client-sdk/react'

export function createConfiguredQueryClient() {
  const client = makeQueryClient()
  setMutationDefaults(client)
  return client
}
```

Use `query.users.byId.key` for the entire operation family or `query.users.byId.getOptions({ id }).queryKey` with `exact: true` for one input/scope. Keys derive from the query operations; there is no separate key registry.

One setup call registers all product mutation defaults. Internal policy stays colocated by feature; consumers never enumerate policies. Mutation hooks return `useMutation(query.users.update.mutationOptions())` directly, preserving its inferred state union/API. Generated options retain the matching mutation key with no overriding lifecycle callbacks. The [complete recipe](client-sdk.md#one-mutation-defaults-installer) shows internal invalidation, inferred keys, and provider lifetime. This factory is module-scoped; a Next server QueryClient is not a module-global singleton.
