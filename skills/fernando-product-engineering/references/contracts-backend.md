# Feature-local operations are the source of truth

## Selected stack and organization

Use **Effect RPC + Effect Schema** for this product direction. Put each domain's schemas, operation declarations, handlers, policy, and DB code together under `core/src/features/<feature>`. Public schemas default to that feature's `api/schema.ts`, beside `api/rpc.ts` and the server binding `api/index.ts`. This is still feature colocation, not a global contracts package. Local-only state/capability definitions stay with their own consumer.

Define the runtime input, success, expected failure, and stream schemas once. Refer to the same schema objects in the API declaration. Derive static types with `typeof SchemaValue.Type` or the schema library's inference helper. Let handler checking and function inference carry them onward. Do not add an independently maintained service interface, transport interface, client interface, query input interface, or operation table.

Each feature follows **schema → db → service → api** as responsibility layering, not a literal import chain. `api/schema.ts` owns public data; `db.ts` owns scoped persistence; `service.ts` authorizes and implements the operation; `api/index.ts` binds that service to the transport. Effect also needs a colocated `api/rpc.ts` describing the wire contract. It imports the same schemas, not copies of them.

`api/index.ts` is server implementation, not merely the contract. A service imports declaration leaves such as `./api/schema`, never `./api`, which binds the service and would create a cycle. The API package aggregates/mounts these feature APIs. Its server export is referenced by client code only through `import type`. A separate explicitly public `@example/api/rpc` barrel exports the client-safe runtime group required by Effect. Neither barrel gives consumers access to arbitrary internal files.

## Server-owned orchestration and safe queries

The public API routes and documented protocols are the product's primary capability boundary across N arbitrary clients. Almost all true core logic must be reachable through them: domain rules, authorization, authoritative state transitions, and orchestration. An independent implementation must not need a particular UI or handwritten JavaScript SDK to discover required product steps. Declare inputs, results, failures, events, and retry/replay semantics at this boundary; implement the behavior in owning services, keeping host route handlers thin. API completeness means exposed behavior, not putting every implementation into a route file or encoding UI rendering as JSON.

Put any logic that can execute on the server in the owning backend service. Design the operation around the shape and outcome the client needs, including authorization, dependent reads, aggregation, and mutation prerequisites. Moving a frontend waterfall into a vanilla client SDK is insufficient: it still creates client round trips and leaves backend decisions in the client.

```ts
// Rejected in a client: one server result is needed to issue the next request.
const user = await client.users.current()
const teams = await client.teams.forUser({ userId: user.id })

// Preferred: one API-defined operation; the service resolves the dependency.
const { user, teams } = await client.users.currentWithTeams()
```

The backend decides whether dependent data requires a full fetch, a scoped fetch, or reuse of valid cached data, using its authorization and freshness policy. Clients must not coordinate that decision with chains of queries, conditional `enabled` prerequisites, mutations, or effects. Independent reads may run concurrently; data that exists only after genuine user input is a separate interaction, not a backend-resolvable waterfall.

Queries must be safe reads: retries, focus/reconnect refetches, and duplicate observers must not start work or change product state. Declare commands as mutations even when idempotent. A command that needs a parent workspace/session ensures that prerequisite on the backend, sharing concurrent creation where required; do not make the client run an open/status/start chain. Dependent writes for one outcome belong in one backend operation with explicit transaction or partial-failure semantics. Backend ownership does not make every mutation safe to replay.

Keep only necessarily local behavior in clients: presentation, unsaved input, host capabilities, and attachment/transport lifecycle that requires the local connection. The vanilla SDK owns the reusable part of that client behavior. A synchronous shell can stay responsive while a backend operation runs.

## Compose operations instead of mode arguments

Avoid options, booleans, or enum arguments whose purpose is to select distinct code paths. Prefer `terminals.attach({ sessionId })` and `computers.attach({ sessionId })` to `surface({ kind: 'terminal' | 'computer', sessionId })` with branching implementations. Each explicit operation composes shared authorization, prerequisite creation, and connection primitives as needed. Do not merely move the same mode switch into a private helper or duplicate shared implementations.

This rule applies to backend services, SDK helpers, hooks, and components. Inject a deliberate capability where an implementation varies. Ordinary parameters such as IDs, pagination limits, and abort signals remain appropriate; schema-derived discriminants describing returned state are not implementation-selection options.

## Effect recipe version

Dependency injection is the backend counterpart of headless React providers. Services declare required capabilities; the authorized host supplies Effect layers for DB access, identity, execution, and other actual dependencies. Keep request identity request-scoped and long-lived resources in their intended host scope. Tests provide alternate implementations through those same contracts. Consumers must not import a concrete live implementation or consult a global service locator to satisfy a dependency. Simple pure functions can continue to receive ordinary arguments.

The examples use the **Effect v3 API family**: `effect@3.22.2`, `@effect/rpc@0.76.2`, and `@effect/platform@0.97.2` were the versions identified in the registry/v3 sources during this revision. Pin and compile the selected set before adopting a runtime template. These snippets are source-verified, not an executed Effect integration. Do not combine them with v4 RC `effect/unstable/*` APIs. [Effect v3 package](https://github.com/Effect-TS/effect/blob/v3/packages/effect/package.json), [RPC v3 package](https://github.com/Effect-TS/effect/blob/v3/packages/rpc/package.json).

In this v3 client, a tag such as `users.byId` produces `client.users.byId`; current v4 RC client behavior differs. The naming convention drives inference rather than a handwritten object mapping. [RPC client implementation](https://github.com/Effect-TS/effect/blob/v3/packages/rpc/src/RpcClient.ts).

## Repeatable feature files and inferred client

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
import { ApiRpc } from '#api/rpc'
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

## One named service export

Each domain service module exports one class: `UsersService`, `ChatService`, and so on. Its operations are methods, so authorized callers read `UsersService.getById(input)`. Keep policy helpers private or feature-local; do not also export each method as a standalone function or construct a parallel function registry.

The example uses static methods because Effect already carries dependencies in the returned effect. `UsersService` holds no actor, credentials, connection, or mutable global state. The host supplies `CurrentActor` and `UsersDb` through request-scoped Effect layers. Static methods must not depend on `this`, allowing the API to bind `UsersService.getById` directly. If a service needs actual instance-owned lifetime/state, use an injected instance deliberately rather than adding a factory to every service.

This class is an intentional consumption boundary; retaining unused methods can be an acceptable cost. Do not promise method-level tree shaking. Keep services out of browser graphs and measure server bundles. ESM barrels still control which classes are public. This convention governs service modules, not a requirement to wrap schema declarations, React parts, or all exports in classes.

```ts
// core/src/features/users/index.ts — approved privileged server surface
export { UsersService } from '#core/features/users/service'
export { UsersApi } from '#core/features/users/api/index'
// UsersDb and policy implementation remain private.
```

## Authority remains explicit

The host authenticates cookies, bearer tokens, or API keys. It supplies a request-local actor capability to the handler/service. The operation checks resource authorization, then calls the scoped DB query. Raw DB code performs persistence and applies supplied tenant predicates; it does not resolve identity or decide policy.

Colocation does not mean exposing raw DB functions. Keep privileged exports separate from declaration exports. Deriving a client type does not authorize a caller. Internal requests and trusted-local clients still use the declared service policy, and a browser cannot select privileged local execution.

A feature's input, output, and DB record may legitimately have different schemas because they describe different data. Explicit output projection prevents private fields escaping. This is not permission to define three copies of the same public User DTO.

Domain errors are schema-defined; unexpected infrastructure errors remain controlled server failures. Writes needing atomic authorization/invariants use the appropriate transaction semantics. Runtime schemas do not prove behavior or encode executable capabilities such as DB objects and React refs.

## Typed failures and globally unique codes

Declare every expected domain failure in the operation's runtime error schema; infer the SDK and UI union from it. Every error variant has a stable, globally unique code across the product. Prefer a namespaced literal discriminant such as `_tag: 'notes.wrong-team'` or `_tag: 'users.unavailable'`; `_tag` can serve as the code, so a duplicate `code` field is unnecessary. Do not identify errors by human-readable messages or ambiguous literals such as `NotFound`. An intentionally shared error variant has one schema owner and one meaning wherever reused.

When recovery needs structured context, include a schema-defined JSON payload on that variant. For example, `notes.wrong-team` can contain `data: { requiredTeamId }` only after the server verifies that the actor may discover and access that team and resource. Otherwise return the permitted generic unavailable/denied variant. The UI can render a typed “Switch team” action without parsing a message or discovering private identifiers. Public payloads contain only authorized recovery information, never raw exceptions or server internals.

Preserve the code and validated payload through RPC and SDK adapters. Normalize transport/decode/unexpected failures once into explicit, separately owned client failure variants; do not cast arbitrary rejected values into the declared API error union. Expected domain failures remain exhaustively distinguishable at the feature boundary. Feature presenters switch exhaustively on the code and use a compile-time `satisfies never` check after the switch, without a runtime-throwing exhaustiveness helper, composing shared design-system error components with appropriate copy/actions. An unknown wire code follows the controlled SDK decode/compatibility failure path rather than masquerading as a known domain failure. See [UI states](ui-states.md).

In adopting-product CI, check that distinct error schemas do not reuse codes, typecheck exhaustive presenters, and verify that an unauthorized wrong-team request cannot reveal the alternate team. Adding an error variant must make an incomplete presenter fail typechecking. These are checks to implement in the consuming repository.

## API hosting and OpenAPI derivation

The API package mounts the composed declaration plus handler layers. A Fetch-compatible host manages `Request`/`Response` and runtime disposal. Effect v3 exposes `RpcServer.toWebHandler`; this is a transport adapter, not a reason to mirror each route in an app. [RPC web handler source](https://github.com/Effect-TS/effect/blob/v3/packages/rpc/src/RpcServer.ts).

The internal path has **no codegen**: API group → RpcClient inference. Browser and server bindings expose the same operations. An in-process server binding must retain the operation's validation/auth/middleware semantics; do not claim a naked core-function call is the same RPC pipeline.

OpenAPI is a separate derived publication. Effect RPC does not automatically generate a complete REST/OpenAPI surface. Implement/select one generic projection from the authoritative operation descriptors and their colocated HTTP metadata, reusing the exact schemas. HTTP method/path/status mappings are additional facts, defined once with the operation; they cannot be inferred reliably from arbitrary method names. Do not maintain a second handwritten DTO or route catalog.

If the chosen Effect APIs cannot express this projection faithfully, report that specific tooling gap and resolve the generic integration before publishing a starter. The gap does not justify switching the selected stack silently or imposing codegen on internal TypeScript clients.

OpenAPI exporter version and external generator streaming support still require verification. A protocol schema is distinct from client-side event assembly; the client SDK owns reconstructed messages. [OpenAPI specification](https://spec.openapis.org/oas/v3.2.0.html).

## Acceptance

Add two operations to one feature. The second addition changes only its colocated declaration/schema/handler and necessary aggregate registration. The inferred RPC and mechanical query options must update without method wrappers or generated TypeScript. Verify malformed input, declared failure, unauthorized access, cross-tenant scope, browser/server bindings, cancellation, and no server implementation in the browser graph. Verify OpenAPI is derived without shape duplication.
