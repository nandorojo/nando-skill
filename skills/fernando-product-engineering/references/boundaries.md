# Boundaries, imports, and structure

## Ownership is the point

Organize by owning product feature first, then colocate role files such as `schema.ts`, `api.ts`, `service.ts`, and `db.ts`. Do not introduce global `contracts`, `schemas`, `types`, `services`, or `hooks` collections. A facade can be a named re-export. Wrap behavior when you need to normalize or narrow it. Do not add pointless runtime wrappers; do not inherit a dependency's entire API via `ComponentProps<typeof Vendor>` or `export *` and call it owned.

An owned React facade may re-export the specific React primitives/types the product uses. This is an intentional foundational API, not a guarantee that a React component can run outside React. Peer dependencies must ensure a single React/context instance.

## Packages should survive an external consumer

Assume each package could be published to npm. This is a consumption design constraint, not a demand to publish private product code. Declare its dependencies, files, runtime requirements, public exports, and types; keep app assets/configuration and unpublished workspace paths out of its import graph. A package can require a declared server runtime without being browser-safe.

App routes consume product screens through `@example/features`. App bootstrap is a distinct owner: root layouts, global providers, SDK/Query client lifetimes, and host configuration belong in `apps/<client>`, not a synthetic `features/app` domain. Bootstrap may directly import the owned SDK, Query, React, and other integration entry points it mounts; declare those dependencies in the app manifest. Each package declares the packages it actually imports as its own dependencies, so SDK/DS/library dependencies arrive transitively; apps do not repeat the entire internal dependency graph. This is a source-ownership preference, not permission to import undeclared transitive dependencies. A host that imports an API mount or a trusted Electron main-process capability declares that owned package directly. Framework binaries, build tools, and required singleton peers such as React remain explicit app dependencies where needed. Do not funnel server or host capabilities through features merely to shorten a manifest.

Test the packed artifact in an isolated consumer using only public exports. Monorepo aliases must not hide missing dependencies or broken declaration paths. Publishing one coherent SDK does not expose every internal module: consumers get the deliberate root/slash barrels, while feature-local implementation remains private.

New API-bearing features default to `core/features/<feature>/api/{schema,rpc,index}.ts` beside `service.ts` and `db.ts`. The smaller flat role-file layout remains equivalent. Public wire types originate in this API area; local UI state is a different contract owned by its UI feature. Derive shared fields/variants rather than copying an API DTO into another type declaration.

## Vanilla roots and explicit adapters

Every package root is vanilla: no React, Next, or platform integration imports or re-exports, including leaked declaration dependencies. Framework adapters have their own folders and explicit public slash imports:

```ts
import { createClient } from '@example/client-sdk'
import { RpcProvider } from '@example/rpc/react'
import { createQuery } from '@example/client-sdk/react'
import { handler } from '@example/api/next'
```

`api/bun`, `api/next`, `rpc/react`, and `client-sdk/react` are deliberate public barrels, not arbitrary deep-import access. API's vanilla root can expose a generic Fetch handler; vanilla means framework-independent, not necessarily safe to execute in a browser. Server imports remain type-only from browser consumers; Effect codecs come from `api/rpc`.

React-based UI packages follow the same rule: `design-system/react` exposes components while the root can expose vanilla tokens; a UI feature is exported from `features/chat/react` or an explicit aggregate `features/react` barrel. Do not re-export these through the root. Web/native component resolution occurs inside the React entry point.

Declare framework peers as optional via `peerDependenciesMeta` when only the corresponding slash adapter needs them. Importing the root must work without those peers; importing the adapter requires its peer. Optional peer metadata does not make an eager import safe. Bun is a runtime requirement of `api/bun`, not automatically an npm peer called bun. Test runtime and type-declaration isolation.

## Import policy

| Source category | Allowed dependency direction |
| --- | --- |
| Generic library adapter | Approved vendor(s) it owns and other lower library primitives |
| DS | Owned library primitives; explicitly registered presentation/host-primitive vendor adapters within DS, never product protocol adapters |
| Core feature | Owned libraries, its colocated schemas/operations/persistence, explicit other-feature capabilities |
| API composition | Core feature API declarations; handler layers through separate server entry points |
| API host/auth integration | API operations plus owned host/auth adapters |
| RPC | Declaration-only API surface; owned Effect/protocol/query integration; no handwritten operation mirror |
| Generated external SDK | Generated runtime dependencies declared in its isolated package |
| Client SDK feature | Inferred RPC or external SDK; owner-local schema subpaths; owned portable libraries |
| Generic RPC query integration | Inferred RPC and owned query primitives |
| Feature-local client React integration | Derived RPC/query options, client semantics, owned React/query primitives |
| Portable UI feature | Client SDK public surfaces and derived React/query integration, DS, owned libraries, explicit feature-local schemas/contracts; no raw transport/protocol operations |
| Feature `next`/`native`/`rsc` integration | Portable feature plus owned adapter for that platform |
| App route/screen | Feature public entry points, including integration subpaths |
| App API mount | Owned API host entry point exposing Request/Response handlers; no direct core/DB calls |
| Actual app bootstrap/config, root layout, global providers | Owned SDK/library/provider entry points and declared host needs; app owns mounting and lifetime |
| Explicit trusted-local CLI root | Declared authorized core/execution entry points through a dedicated integration |

`@example/features` being installed locally does not make all of its internals public. Resolve package export maps and paths; forbid reaching `../core/src/users/db` or an alias with the same destination. Restrictions apply to `import type`, dynamic import, `require`, and re-exports. Generated code is isolated, not exempted by renaming a handwritten directory.

Prefer absolute imports and re-exports throughout handwritten source, including within a package. Use approved package specifiers such as `@example/client-sdk/react`; internal code may self-reference an appropriate public subpath when that does not create a barrel cycle. For private same-package leaves, configure a package-local absolute `#...` import map (with matching build/type resolution), instead of exposing private files as public exports or inventing workspace-only `@example/pkg/src/...` paths. Never have a barrel's implementation import back through that barrel. Relative asset URLs, framework-required references, and generated code are scoped exceptions; do not rewrite them blindly. The same public/private boundary checks apply regardless of spelling. Verify these imports in packed artifacts, not only through a workspace tsconfig alias.

A generic DS embed owns neutral frame/webview mechanics and accessible presentation. It must not decode a product vendor's message envelopes, interpret connection readiness, or implement capability renewal. Put that protocol in its registered owned SDK/library adapter; pass neutral capabilities/events to the DS. Register protocol primitives and vendor imports in the boundary policy so import wrappers cannot conceal ownership violations. Portable features likewise do not create raw fetch/socket transports or decode protocol events.

The logical layer may live inside one package at first. Enforce resolved paths as well as package names. `libraries` is not a dumping ground or a way to launder upward imports. Use an adapter inventory mapping entry point → owned dependency → public contract → test.

## Necessary host distinctions

- App manifests may declare framework binaries, build plugins, peer dependencies, and runtime dependencies required by the platform. Zero direct product-source imports is different from zero installed packages.
- Generated `react/jsx-runtime` imports come from the JSX compiler. Permit the compiler runtime, not handwritten imports everywhere.
- Next route segment exports, metadata, and required root HTML/body belong in the app framework boundary (for example `apps/web/app/layout.tsx`). Root-layout code is application bootstrap, not portable feature code. Register that role explicitly in boundary checks; do not move the document shell into features to satisfy a feature host-tag rule.
- API mount files have an explicit host role: an app's `app/api/.../route.ts` may re-export an owned API host handler. The feature-entry-point preference applies to product route/screen content, not root bootstrap; routing HTTP through a feature package would invert responsibilities.
- Put Next hook adapters in owned libraries; feature Next integration composes those into feature contracts. No Next import in a portable feature.
- Test/config files have declared tooling allowances. Tests may import the test runner; helpers do not silently become new application surfaces.
- The core SDK is a privileged server capability. A browser cannot opt into a “local” mode to bypass the API. A trusted CLI integration wires core services intentionally, with identity and execution policy.

Record exceptions by path, permitted imports, and reason in a machine-readable boundary policy when tooling is implemented. Do not scatter inline eslint disables or broadly exempt `apps/**`.

## Public exports and source layout

A core feature can expose `./users/schema` and `./users/rpc` as declaration-only public barrels, and a separate privileged `./users/server` surface. The browser/RPC may import the first two as required for inference/encoding; it must not reach handler layers, DB implementations, or request credentials. A package called core is not inherently all-server: inspect the resolved module graph.

```text
core/src/features/users/
  api/
    schema.ts    # authoritative public data
    rpc.ts       # client-safe wire declaration
    index.ts     # binds UsersService for mounting
  service.ts     # one UsersService class export
  db.ts          # private scoped persistence
api/src/
  index.ts       # vanilla Fetch server surface + Api type
  rpc/index.ts   # client-safe aggregate runtime group
  next/index.ts  # Next mount adapter, optional peer
  bun/index.ts   # Bun mount adapter
rpc/src/
  index.ts       # inferred client type/acquisition
  client.ts      # browser/native runtime binding
  server/index.ts # server runtime binding
  react/index.ts # if RPC owns a React adapter; SDK exposes the product ./react surface
client-sdk/src/
  index.ts       # vanilla createClient + consumer types
  react/index.ts # one React/query public surface
  features/users/react.ts # domain implementation, re-exported directly by react/index.ts
features/src/users/
  schema.ts      # UI-only state when distinct from the API result
  contract.ts
  react/
    context.tsx
    use-users.ts
    list.tsx
    item.tsx
    index.ts
  index.ts       # vanilla feature data/helpers only
```

## One barrel at the consumed export boundary

Use one barrel layer per public entry point that consumers actually import. Re-export implementation files directly there; do not create folder barrels that feed feature barrels that feed package barrels. Internal code imports implementation leaves through configured private aliases. External consumers still use declared public exports; this rule does not permit private/deep-import bypasses.

```ts
// features/src/chat/composer/react/index.ts
// The export map exposes this directly as @example/features/chat/composer/react.
export { ComposerFrame as Frame } from '#features/chat/composer/react/frame'
export { ComposerInput as Input } from '#features/chat/composer/react/input'
export { ComposerSubmit as Submit } from '#features/chat/composer/react/submit'

// Consumer: namespace syntax needs no second chat/index.ts barrel.
import * as Composer from '@example/features/chat/composer/react'
```

If consumers need an aggregate `features/chat/react` surface instead, that single entry point directly re-exports the implementation leaves. Do not route it through the composer barrel. Choose public entry points for real consumption needs, not one per folder.

Named exports and `export *` can assemble implementation modules at this boundary. `export * as` is appropriate for an implementation module, not a way to disguise another barrel layer. Vendor wildcard re-exports remain prohibited. A schema module or `api/index.ts` that implements service binding is not a barrel simply because it exports multiple symbols or is named index. Separate package boundaries may each expose their own public entry; do not bypass a dependency's public API to flatten those boundaries. Keep vanilla, React, server, and platform graphs separate. Namespace syntax does not by itself prove tree shaking; verify the selected bundler.

Every package consumes other packages through approved barrels only; block all remaining source/private paths, including relative/alias bypasses. An export map must expose real build/declaration paths and preserve command-click navigation through declaration/source maps. No `./*` escape hatch into private files. Core/DS/feature export maps are boundary policy, not an excuse to physically collect all contracts by code type.

## Predictable files

Proposed baseline, to be adopted consistently:

- Kebab-case folders/files, PascalCase components/types, camelCase functions; named exports except required framework default exports. Derive an implementation filename from its primary export and role: `RouteExistingNote` belongs in `route-existing-note.tsx`, not a copied `messages.tsx`. A directory may supply redundant feature context, but the filename must still identify the actual responsibility. Update filenames/imports when adapting a sample to a different feature; required framework filenames and deliberate barrels are exceptions.
- Feature-local `schema.ts`: runtime data schemas and inferred data types. Feature-local `contract.ts`: ports/actions/props from those schemas only when needed. Use `typeof`/schema inference instead of repeating shapes. Inline the schema with its operation when that reads better.
- `context.tsx`: context, validating accessor, pure injected provider. `providers/<use-case>.tsx`: actual state implementation/composition. A provider should not silently fetch unless its role says it does.
- Feature-local `api/schema.ts`: runtime data owner. `api/rpc.ts`: wire declaration bound to those schemas. `api/index.ts`: server binding to `UsersService` methods. `service.ts`: one named authorized service class. `db.ts`: private raw persistence. `index.ts`: intentional ESM public surface, no hidden side effects. Do not manufacture matching service/client interfaces or factories for every operation.
- No anonymous `utils.ts`/`helpers.ts` buckets. Name the operation/domain (`assemble.ts`, `display.ts`, `query-key.ts`).
- Import order: owned public package imports, package-local absolute imports, then scoped non-code exceptions; type-only markers for types. Use Oxfmt as the single formatter; use Oxlint for linting. Follow the [code styleguide](styleguide.md), including comments only for non-obvious reasoning or constraints.
- Tests sit next to the owned behavior or in that package's test folder. Generated artifacts stay visibly generated and are never hand-edited.

Use feature folders before code-role files; no global contracts or hooks directories. Default to **one primary export per implementation file**: each page, screen, provider, and independently consumed UI component gets a role-named file. A file containing several route pages is not a page module; move each page to its own file and compose their exports in `index.ts`. Keep private, tightly coupled helpers and associated types beside their primary export. Intentional barrels, cohesive generic library helpers, schema/type modules, context/accessor pairs, and required framework exports are exceptions; do not split every symbol reflexively. This improves ownership and independently selectable modules, but file count alone does not prove tree shaking.

For example, `notes/next/` contains `new-page.tsx`, `existing-page.tsx`, `existing-live-page.tsx`, `page-shell.tsx`, and the `index.ts` barrel. A private resolved-params child can remain beside its one existing page until it is independently reused. Name a file exporting `QueryProvider` as `query-provider.tsx`; reserve `app-provider.tsx` for the complete app composition. A shared `page-shell.tsx` must own a meaningful common boundary or layout, not merely add another indirection.

Keep provider/Suspense wrappers when each owns a distinct lifetime, capability, or suspension boundary. Make that responsibility visible in the name and tree; remove pass-through wrappers with no responsibility. Do not flatten legitimate providers just to reduce nesting or hoist suspending reads out of their local boundaries. A screens directory can compose reusable parts, but reusable parts must not import a screen.
