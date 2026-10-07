# Platform implementations and optional RSC

## Explicit framework imports

Root package imports stay vanilla. React/Next/Bun integrations live in their own folders and public slash barrels, with optional npm peers where appropriate. Use `rpc/react`, `client-sdk/react`, `api/next`, and `api/bun`; do not re-export adapter symbols from package roots. `design-system/react` and explicit feature React barrels follow the same rule. [Concrete package recipes](recipes.md#3-package-exports-and-optional-peers).

## Web-first files, shared interfaces

Write the common prop contract in a neutral `contract.ts`. `index.tsx` is the web implementation; `index.native.tsx` implements the same interface for native. Optional `.ios`/`.android` entry points select more specific implementation when needed. Verify the actual resolver order and package export conditions in each target build; suffix names alone are not a working configuration.

Both DS implementations own their host primitives. Shared features import the DS public entry point, never `div`, `span`, `iframe`, React Native `View`, or a vendor TextInput. A computer embed's web implementation can use an iframe and native can use an owned webview/native capability. Do not expose HTML iframe props as the universal feature contract. The DS owns neutral embedding mechanics only; vendor message validation, readiness interpretation, and connection recovery belong in the registered SDK/protocol adapter. An iframe load event is not an application-readiness contract.

Tailwind is the shared styling vocabulary. Web uses its ordinary CSS/PostCSS build; native supplies its chosen Tailwind-compatible compiler/adapter. Explicitly define a portable utility subset and semantic tokens; browser-only CSS, keyboard interactions, and native gestures need platform behavior. Native parity requires visual and accessibility checks, not just matching TypeScript props. Avoid React Native Web in the web DS under this policy.

Use semantic event callbacks (`onPress`, `onChangeText`) and platform-neutral imperative handles (`focus`). Do not export DOM mouse events from the shared contract or obtain it from `.native.tsx`. Vendors' full props and `as any` casts defeat ownership.

## Portable features and colocated host adapters

A feature's portable React implementation consumes SDK resources, DS components, and neutral capabilities. Its `next/`, `native/`, or `electron/` sibling is an **integration entry point**, not part of that portable implementation. This preserves useful feature colocation while making dependency direction explicit: host adapter → portable feature → SDK/DS. Portable files must never import their host siblings, directly or through a mixed barrel.

Keep host folders minimal: only code whose actual dependency or contract requires that host belongs there. Inspect transitive imports as well as the file itself: a component calling a helper that imports Next `useParams` still depends on Next, even when its own imports look like ordinary React. Conversely, accepting an already-resolved ID and composing a portable provider with a screen is shared React code, even if first used on a Next page. Keep that composition in `react/`; the Next adapter reads/decodes the route ID and renders it. Keep only host-specific route decoding, navigation, and framework page contracts in the integration folder. Two Next apps (for example admin and public) can consume the same `features/notes/next` entry point and supply their own capabilities; no dependency on either app is allowed. Split host compositions when their actual product behavior differs. Do not introduce a mandatory `renderers` or `platforms` package merely because more than one client exists. Extract a separate integration package only when a real independent consumer or release/dependency boundary warrants it; preserve feature grouping there.

Classify reusable infrastructure by the capability it uses, not by its first consumer:

| Responsibility | Owner |
| --- | --- |
| Generic query client and hydration primitives | `libraries/query/react` (or a server-only `rsc` entry when needed) |
| Product-inferred query surface and reusable prefetch orchestration | `client-sdk/react` and server-only `client-sdk/rsc` |
| Next headers, cookies, navigation, and route conventions | Explicit `next` adapter |
| A resolved note ID composed with a portable provider/screen | `features/notes/react` |
| A feature's server prefetch composition | `features/notes/rsc` when host-independent; Next-specific request/route reads stay in `next` |
| App-wide provider mounting, SDK/Query client lifetimes, and host capability composition | `apps/<client>` bootstrap (for example `apps/web/app/providers.tsx`) |
| Framework entry files and configuration | `apps/<client>` |

RSC describes a rendering capability; Next describes a framework. Use `rsc` for helpers that have no Next dependency, and keep Next request APIs outside them. A shared `Prefetch` implementation is SDK integration, not an app feature that other features import. Host composition may supply its request-scoped query/client handles; the SDK never imports back into app bootstrap to obtain them.

One app `Providers` component can directly mount both QueryClientProvider and the SDK context. Do not add `ProductClientProvider` → `ClientSDKProvider` or `QueryProvider` → `QueryClientProvider` forwarding layers solely to give each dependency a file; separate wrappers require independent behavior, reuse, or subscription ownership. The SDK client calls the API; QueryClient manages cache/request lifecycle. Different objects do not inherently require extra wrapper components.

Name a provider file for its actual responsibility: `query-provider.tsx` exports `QueryProvider`; reserve `provider.tsx` or `app-provider.tsx` for the intentional aggregate app provider. The aggregate may compose query, client, theme, and other providers without giving each one the same generic filename. Name components for their role and match implementation filenames: `route-existing-note.tsx` exports `RouteExistingNote`, not `messages.tsx`. Framework-mandated route filenames are an exception. Every public page or substantive screen has its own implementation file; a barrel can re-export them. A private resolved child can remain with its one owning page when it only establishes that page's asynchronous boundary.

Wrappers must own a concrete contract, lifetime, layout, or suspension boundary. A synchronous page → local Suspense → async `ResolvedExistingNotePage` is useful: the shell can render before route data resolves. Do not remove that boundary just to reduce nesting. Conversely, do not add alternate live/static page variants, redundant providers, or fallback wrappers unless the app uses those compositions. Preserve provider identity at the level where drafts, focus, and selection should survive navigation.

Page props express the state and events that page actually uses. Prefer a flat `id`/`noteId` prop whose type is derived from the operation's ID field; the SDK call still receives its inferred input object. An existing-item page does not acquire an `onCreated` prop just because a new-item page has one. Wire creation to the host's real navigation action where creation occurs; unused callbacks, `void onCreated`, and no-op handlers do not implement navigation.

## Routing and state source

The feature asks for a selected chat and a select action; it does not ask for URLSearchParams. A page adapter can implement that contract from path params, search params, or a navigation state. A modal can implement it with local state. The same feature consumes each.

`features/chat/next` may implement a feature contract with an owned Next navigation adapter; `features/chat/native` uses a native navigation adapter. Shared `features/chat/*` must not import either integration. Integration entry points import portable features, never the reverse.

Prefer an owned navigation capability over binding every web DS Link to Next if several web hosts must work without rebuild. Alternatively bind one platform entry point to a router when that is the explicit build choice. In either case narrow `href` and navigation behavior; preserve semantics such as external links and accessibility at the adapter boundary.

Product routes/screens consume feature public entry points. Root layout and app bootstrap directly compose owned SDK/library providers and declare those dependencies, as defined in [boundaries](boundaries.md); this is their normal responsibility, not feature-specific code or a special workaround. A Next page should remain a tiny composition/entry point; Next-specific details do not belong in a generic client SDK.

## Route reads suspend where they are consumed

Next does not prohibit reading route data in a provider. The issue is **where the read happens**: a high provider that calls a suspending route hook moves suspension above the leaf that needs the value. A boundary returned below that read cannot catch it. Keep the reader inside a suitably narrow boundary, or pass an unresolved resource through the provider and let the leaf read it. Next explicitly recommends moving route-hook reads down when possible. [URL data outside Suspense](https://nextjs.org/docs/messages/blocking-prerender-client-hook).

| Source | Documented behavior | Placement |
| --- | --- | --- |
| Client `useSearchParams` | Can suspend during production prerendering; development may hide a missing boundary | Small client reader inside Suspense |
| Client `useParams` | With Cache Components, params unknown at prerender time can suspend; known/static-generated params need not | Choose boundary based on route and pinned Next configuration |
| Page `params` / `searchParams` promises | Resolve in server code, or pass the resource to a client reader | Await in an async child beneath Suspense, or unwrap at the consuming leaf |

These are conditional behaviors, not a rule that every route hook always throws. [useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params), [useParams](https://nextjs.org/docs/app/api-reference/functions/use-params), [Page props](https://nextjs.org/docs/app/api-reference/file-conventions/page).

### Pass a value or promise; unwrap at the leaf

```tsx
// features/chat/selection/context.tsx — portable React boundary
'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { Client, InputOf } from '@example/client-sdk'

type ChatId = InputOf<Client['chat']['byId']>['id']
type ChatIdValue = ChatId | Promise<ChatId>
const ChatIdContext = createContext<ChatIdValue | null>(null)

export function ChatIdProvider({ value, children }: {
  value: ChatIdValue
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

`use` permits this conditional resource read. A pending promise suspends the component that calls `useChatId`; a rejection goes to its error boundary. Keep the promise stable across client rerenders. Create/derive it on the server or use an established resource cache, not a new client-render `.then()`/`Promise.resolve()` each time. This sample assumes the API's ID representation is a string; validation still follows the owning schema. [React use](https://react.dev/reference/react/use).

```tsx
// features/chat/next/page.tsx — server integration, re-exported by app page
import { Suspense } from '@example/libraries/react'
import { ChatIdProvider } from '#features/chat/selection/context'
import { ChatShell, ChatMessages, ChatMessagesPending } from '@example/features/chat/react'

export default function ChatPage({ params }: PageProps<'/chat/[id]'>) {
  const chatId = params.then(({ id }) => id)
  return (
    <ChatIdProvider value={chatId}>
      <ChatShell>
        <Suspense fallback={<ChatMessagesPending />}>
          <ChatMessages />
        </Suspense>
      </ChatShell>
    </ChatIdProvider>
  )
}
```

`ChatMessages` reads `useChatId`; `ChatShell` does not. The provider passes the promise without unwrapping it. Supply the route's error boundary for failed resolution. `PageProps` is the Next-generated route type in this integration sketch. Real route schema validation can be included in the server mapping. The exact `params.then` projection is a production-validation target for the pinned Next prerender configuration; React documents the leaf `use` behavior, not every detail of Next's route-promise instrumentation. The equivalent search-param mapping must handle absent or repeated values according to the feature's schema, not assert that every key is a string.

If the feature needs a resolved value instead, keep the shell synchronous and await `params` or `searchParams` inside an async child under the intended Suspense boundary. Pass the resolved scalar to the same provider. Awaiting at the high page/layout before returning its boundary defeats that placement. These choices preserve where waiting occurs; neither makes a server snapshot reactive to later browser history writes.

### Live client URL reads are a different source

A context `string | Promise<string>` supports a static value and a deferred snapshot. It does not subscribe to `pushState`. A router navigation can deliver updated server props; a history-only write does not itself regenerate the promise previously passed through RSC. If the URL should continuously drive the feature, supply a live reader or explicitly synchronize an owned client controller.

Prefer a **statically imported** Next-specific hook in a small route adapter under the consuming boundary. It can call owned `useParams`/`useSearchParams` there, then pass the result into the portable provider for that small subtree. Different independently suspended regions can have their own small readers; the global shell need not read route data.

```tsx
// features/chat/react/chat-messages-for-id.tsx — reusable resolved-ID composition
'use client'

import type { Client, InputOf } from '@example/client-sdk'
import { ChatIdProvider } from '#features/chat/selection/context'
import { ChatMessages } from '#features/chat/react/chat-messages'

type ChatId = InputOf<Client['chat']['byId']>['id']

export function ChatMessagesForId({ id }: { id: ChatId }) {
  return <ChatIdProvider value={id}><ChatMessages /></ChatIdProvider>
}
```

```tsx
// features/chat/next/route-chat-messages.tsx — only the live Next route binding
'use client'

import { useRouteChatId } from '#features/chat/next/use-route-chat-id'
import { ChatMessagesForId } from '#features/chat/react/chat-messages-for-id'

export function RouteChatMessages() {
  const id = useRouteChatId()
  return <ChatMessagesForId id={id} />
}
```

A modal, Electron view, or resolved server-route child can reuse `ChatMessagesForId` with its own ID source. The live Next binding remains in `next/` because its hook transitively depends on Next. Moving the unchanged route-reader component to `react/` would only conceal that dependency. Extract the reusable composition when it is actually shared; this pattern is not a requirement to add a new wrapper around every provider/screen pair.

`useRouteChatId` statically calls the owned Next navigation hook and decodes the feature ID. Mount `RouteChatMessages` under the local Suspense/error boundary. This provider is intentionally small; it does not hoist the read to the app root. A compiler/resolver-selected adapter module can also preserve static hook calls, provided the build proves the selected implementation and neutral contract.

Do not adopt `use(Context).useChatId()` or `<Context value={{ useChatId }}>` as our injection mechanism. Even if a stable injected hook happens to execute today, React explicitly discourages passing hooks as values; it impairs static analysis and optimization and can change hook order if the implementation changes. Inject values/resources or ordinary capabilities, while keeping hook calls static. [React rules on dynamic hooks](https://react.dev/reference/rules/react-calls-components-and-hooks).

A more advanced live abstraction could inject `subscribe`, `getSnapshot`, and `getServerSnapshot` into a static `useSyncExternalStore` hook. Those are ordinary capability functions, not injected hooks. It needs a cached synchronous snapshot, hydration agreement, and complete notification behavior for history, router navigation, and back/forward. Do not casually combine a suspending promise snapshot with that store: React discourages suspending from external-store values. This is an optional adapter investigation, not a new required routing system. [External-store contract](https://react.dev/reference/react/useSyncExternalStore).

### URL writes need not subscribe to URL reads

A same-page web URL updater can read `window.location` when an event dispatches, without calling `useParams`/`useSearchParams` during render. Next supports native `pushState`/`replaceState` and synchronizes its pathname/search readers. This provides an implementation option for SPA UI state. [Next native history API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api).

```ts
// libraries/navigation/next/search-updater.ts — web implementation only
'use client'

type SearchPatch = Readonly<Record<string, string | null>>

export function updateSearchParams(patch: SearchPatch) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) url.searchParams.delete(key)
    else url.searchParams.set(key, value)
  }
  window.history.pushState(null, '', url.pathname + url.search + url.hash)
}

export function useUpdateSearchParams() {
  return updateSearchParams
}
```

The hook-shaped convenience returns a module function and reads no browser state during render; callers may use the ordinary function directly in handlers. Sequential writes merge from the latest URL and retain unrelated keys/hash. Publish a separate replace action when needed. This narrow example handles scalar keys; extend the owned contract intentionally for repeated values. Do not copy Next's internal history state markers into the new entry. Native clients supply their own navigation implementation.

A feature-specific action maps product state to this generic updater, so components still call an action such as `selectChat(id)`. Use proper router navigation when the intended change requires fresh server-rendered content. “No full page reload” is documented; “never any RSC request” is not a blanket guarantee. History synchronization, server rendering, and retained UI state require the production checks below.

The event-time updater is a proposed owned implementation. Verify URL synchronization and routing behavior against the host framework; a familiar consumer shape is not evidence of subscription or request behavior.

### Production verification backlog

Pin Next and its Cache Components configuration; run a production build/server, since development alone can hide suspension behavior. Verify:

- Static search reads with missing versus local boundaries; generated versus unknown path params with Cache Components.
- High route-reader providers versus leaf readers; server-awaited props versus leaf-unwrapped promises; retained shell HTML and fallback location.
- History push/replace, router navigation, and back/forward: URL-to-UI updates, RSC request/server-render counts, and expected behavior of server snapshot props.
- Rapid updater calls preserve latest query state, unrelated keys, and hash; no dependence on an already-running dev server.
- Provider mounts, chat draft, focus, and scroll stay intact at the intended ownership boundary.
- React Compiler/lint behavior for the static adapters; no dynamic hook injection to evade a boundary problem.

These integration checks remain TODO. Documentation establishes the placement constraints, not that a future adapter preserves every RSC/navigation behavior.

## React Query in Next.js: follow the official integration

**Before implementing or changing this compatibility layer, read the official [TanStack Advanced Server Rendering guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), especially Initial setup and Streaming with Server Components.** Use the installed version's APIs. Next's [SPA guide](https://nextjs.org/docs/app/guides/single-page-applications) provides host context.

The documented provider is a Client Component. Its client factory creates a fresh QueryClient on the server and retains a browser client across initial suspension. Do not replace this with `new QueryClient()` on every provider render, or casually initialize it with component state above an initial suspension. Pending hydration is optional and needs the documented configuration/boundary. An optional React `cache` wrapper for server reuse is request-scoped, not a process singleton. [TanStack provider and streaming documentation](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).

Our architectural additions are limited: own the imports, keep mounting in the host integration, obtain queries from the inferred API, and share the integration so pages do not repeat it. Do not substitute a new homegrown mounting protocol for the official one.

### Short provider example, matched to the reference repo's installed version

This illustrative example targets `@tanstack/react-query@5.101.4` and uses `environmentManager.isServer()` and `prefetchQuery`. Do not mix APIs from moving latest documentation with a different installed version; verify the actual exports before adapting it.

```ts
// libraries/query/react/client.ts — generic owned adapter
import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000 },
      dehydrate: {
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  })
}

```

```ts
// apps/web/app/query-client.ts — module-defined product setup
import { environmentManager, makeQueryClient } from '@example/libraries/query/react'
import type { QueryClient } from '@example/libraries/query/react'
import { setMutationDefaults } from '@example/client-sdk/react'

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

The one SDK installer owns product mutation invalidation/reconciliation. Register it once per constructed QueryClient, before mounting consumers; no registration effect or repeated per-hook callbacks. Keep this product composition outside the generic Query library. See [mutation-default ownership](client-sdk.md#one-mutation-defaults-installer).

```tsx
// apps/web/app/providers.tsx — one application bootstrap component
'use client'

import { ClientSDKProvider } from '@example/client-sdk/react'
import { QueryClientProvider } from '@example/libraries/query/react'
import { getQueryClient } from '#app/query-client'
import { getSdkClient } from '#app/sdk-client'
import type { ReactNode } from '@example/libraries/react'

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  const sdkClient = getSdkClient()
  return (
    <QueryClientProvider client={queryClient}>
      <ClientSDKProvider client={sdkClient}>{children}</ClientSDKProvider>
    </QueryClientProvider>
  )
}
```

`getSdkClient` denotes app-owned SDK initialization, not a copy of `getQueryClient`. Its implementation follows [the SDK's actual scope/resource requirements](client-sdk.md#sdk-initialization-is-independent-of-query-hydration): a safe stateless instance can be shared, request-bound credentials/state require isolation, and owned resources require cleanup. It must not import Query's `environmentManager` merely to mirror cache setup. This illustrative helper could instead be a configured constant when justified; it is not a required factory or a TanStack export. Hydration transfers Query state, never this SDK instance.

```tsx
// apps/web/app/layout.tsx — synchronous app-owned document shell
import { Providers } from '#app/providers'
import type { ReactNode } from '@example/libraries/react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>
}
```

The provider is mounted once through this root layout, above feature routes. These `apps/web/app` modules are application bootstrap; they do not belong to a feature package. The `#app` alias is private app wiring configured by the host. Every feature consumes this same browser client; feature entry points must not wrap themselves in another QueryClientProvider. Do not add a separate RPC provider when the SDK context already supplies the required binding. These are adapter examples, not a tested Next app. Native persistence/focus/connectivity belong in the native implementation of the provider.

### Optional prefetch, with a small caller

Our RSC principle is SPA-first: preserve the shell, Next.js instant navigation, and partial prerendering. **Never await data, route params, credentials, or prefetch setup at the top-level RSC boundary before returning its tree.** Start work without awaiting it; place required suspending reads under the smallest useful Suspense boundary. This is our architectural constraint, not a claim that Next forbids async components.

At a prefetch boundary, specify inferred operations and already-available key inputs. A shared host request integration binds the complete RPC/query surface once and passes it with the QueryClient to the reusable SDK helper. It must provide those handles synchronously here; asynchronous work belongs inside the registered query functions or in an explicitly bounded child. A page does not create per-domain query factories, clients, or services.

```tsx
// Proposed convenience call; import Prefetch from @example/client-sdk/rsc.
// queryClient and queryApi are supplied by the request-scoped host integration.
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

`client` is the QueryClient; `query` is the automatically inferred product query interface. Operation names above are illustrative and must come from actual API declarations. One callback may start as many independent reads as its boundary needs.

The wrapper is synchronous. It invokes the callback, which registers its prefetches immediately, then dehydrates their pending state. An `async` callback is accepted for the requested call-site shape, but it must not `await` before registering those queries. `void` alone does not make queries added after dehydration appear in the emitted snapshot. Move an asynchronous prerequisite into the query function when its cache key is already known, or resolve it in a child beneath Suspense before mounting this helper.

```tsx
// client-sdk/src/rsc/prefetch.tsx — proposed shared server-only integration
import { dehydrate, HydrationBoundary } from '@example/libraries/query/react'
import type { QueryClient } from '@example/libraries/query/react'
import type { Query } from '@example/client-sdk/react'
import type { ReactNode } from '@example/libraries/react'

type PrefetchContext = {
  client: QueryClient
  query: Query
}

type PrefetchProps = {
  children: ReactNode
  client: QueryClient
  queryApi: Query
  query(context: PrefetchContext): void | Promise<void>
  reportSetupError(error: unknown): void
}

export function Prefetch({ client, queryApi, query: prepare, reportSetupError, children }: PrefetchProps) {
  // Invocation registers queries now; do not wait for their promises.
  void Promise.resolve(prepare({ client, query: queryApi })).catch(reportSetupError)
  return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
}
```

A host-owned `getRequestQuery` can be a **synchronous** request-scoped accessor to the inferred query interface, not a renamed async function. Its implementation must not perform a suspending credential/route read in this wrapper. Already-scoped capabilities can carry asynchronous credential resolution inside the actual query function. If the integration cannot supply a handle here, use a bounded child or omit this optional prefetch; do not conceal an await in a higher layout. Never put credential-bearing instances in process-global state.

`reportPrefetchSetupError` observes unexpected callback rejections without blocking rendering; it must report them, not disguise setup as successful data. Query/auth failures belong to the registered query's normal error path. This helper's preparation callback is for starting queries, not redirects or required page work. It stays server-side, never becoming a Client Component prop.

The host factory creates a fresh QueryClient for server use (or reuses one only within the request); the supplied `client` starts and dehydrates the same work. The SDK helper receives both handles explicitly and knows nothing about Next credentials or app bootstrap. A host may bind these inputs once in its request integration to retain a shorter local call site. Enable dehydration of pending queries using the configuration above. The dehydrated pending promises are what React streams—the return value of a `void` callback is not itself the streamed resource. This matches the [TanStack streaming approach](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), using the installed version's `prefetchQuery` spelling.

Required route/session inputs may be awaited **inside an async child beneath Suspense**, never before the high shell returns. A query cannot register the correct cache key before its key inputs exist. Plain `useQuery` can adopt hydrated pending data while remaining an independently fetching SPA hook; it does not itself suspend. Keep prefetching optional rather than requiring an RSC-created promise in the portable feature contract.

Auth identity/cache scope must agree between server prefetch and browser consumption. Never cache a personalized client process-wide; reset or replace browser caches on account transitions. Do not persist pending promises in native storage. Match public error/serialization policy to the actual host; do not blindly copy Next-specific error-redaction settings into a generic adapter.

## Platform acceptance

- Provider mounting and QueryClient lifetimes match the official guide for the pinned version.
- Prefetch and dehydration use the same instance; pending promises are included and the shell renders while they remain unresolved. The wrapper never awaits setup or queries; callbacks register before yielding. Browser rerenders do not reconstruct the client.
- Shared UI runs without the RSC wrapper and does not import Next, Electron, or server implementation, including through local hooks and other transitive imports. Public barrels preserve those independent graphs. Resolved-ID compositions are reusable outside host folders; route adapters contain only their host binding.
- Reusable SDK/RSC infrastructure imports no feature or app module; host-specific request reads stay in the host adapter.
- Each exported page has its own file; filenames identify the exported provider; props and wrapper boundaries have an actual consumer/responsibility.
- Real web/native resolution selects implementations of one neutral prop contract.
- Initial loading, successful empty data, and stale refresh failure render separately.
- The actual route transition preserves the selected draft/focus/scroll ownership.

## Stable asynchronous route frames

Render the shared region frame before route/session prerequisites resolve. Suspense fallbacks and ordinary query pending presentations reuse the same layout and visual anchors as resolved content; avoid a null panel fallback followed by an appearing header, or unrelated loading text that moves to another alignment on resolution. Do not show fabricated resource data. Verify both the deferred route shell and subsequent client-query transitions; an instant outer shell alone does not prove visual continuity. See [UI-state continuity](ui-states.md#visual-continuity-across-asynchronous-states).
