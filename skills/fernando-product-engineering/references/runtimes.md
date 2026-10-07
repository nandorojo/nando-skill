# Build any client; inject the execution environment

## The SDK is the product's consumption boundary

“SDK” here includes the inferred internal RPC, generated external language clients, portable product helpers, and optional framework integration. Given that surface, another team should be able to build a complete client without copying a feature's business logic or importing server internals. The React feature package is a convenient reusable UI consumer; Swift does not need to reuse React to reuse the product.

A second-client acceptance fixture must exercise the meaningful lifecycle through public SDK exports, including recovery/cancellation when the product has those capabilities. Calling several raw endpoints proves transport availability, not SDK completeness. Cross-language semantic implementations share behavioral fixtures; app UI must not supply missing lifecycle policy.

One root `createClient()` exposes the whole product. Internally, keep feature-local modules and statically analyzable public barrels. “Consumable monolith” describes the caller's coherent interface, not one implementation file, a hand-maintained operation registry, or a requirement to eagerly initialize every integration.

| Consumer | Product access | Composition it owns |
| --- | --- | --- |
| Next.js or native React app | Root client SDK plus `./react` for server state/subscriptions | Providers, routing, cache lifetime; optional server prefetch |
| Swift app | API-derived Swift SDK plus thin semantic helpers | Native UI, platform storage, SDK connection lifetime binding |
| CLI | Root client SDK; explicit trusted host integration when needed | Terminal UX; approved local execution capabilities |
| MCP server | Root client SDK inside an owned MCP adapter | MCP tool exposure and caller identity mapping |
| Coding-agent harness | Authorized API/core entry points and execution capabilities | Model/orchestration lifetime, tool execution placement |

MCP tools can project an approved subset of existing operations; do not hand-copy their payload schemas. Protocol-specific descriptions and exposure policy are real adapter responsibilities. An authenticated MCP server must preserve its user's scope when invoking the API. Swift-generated DTOs are derived artifacts, not a second manually maintained schema source.

## Three independently chosen environments

Separate where the **client** runs, where the **agent orchestration/API** runs, and where **tools execute**. Network transport is another choice: HTTP, WebSocket, or in-process dispatch does not imply a particular execution location.

```text
Mobile UI ── product SDK ── cloud API / agent ── execution capability ── sandbox
CLI       ── product SDK ── cloud API / agent ── worker connection    ── local tools
CLI       ── in-process API / agent           ── execution capability ── local tools
```

These are distinct root compositions of the same contracts. Shared feature code never checks `isLocal`, `isSandbox`, or the presence of `window` to decide where a command executes. A model's output cannot select an unapproved runtime. The host authorizes and binds the capability for the session/workspace.

## Define the execution contract once

The following is a minimal **owned API design sketch**, using the selected Effect v3 Schema syntax. It illustrates one possible task protocol; it does not prescribe a mandatory execution subsystem for every product.

```ts
// core/src/features/execution/api/schema.ts
import { Schema } from '@example/libraries/effect'

export const Run = Schema.Struct({
  taskId: Schema.String,
  workspaceId: Schema.String,
  command: Schema.String,
})

export const Event = Schema.Union(
  Schema.Struct({
    _tag: Schema.Literal('output'),
    taskId: Schema.String,
    stream: Schema.Literal('stdout', 'stderr'),
    text: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal('exited'),
    taskId: Schema.String,
    exitCode: Schema.Number,
  }),
  Schema.Struct({
    _tag: Schema.Literal('failed'),
    taskId: Schema.String,
    reason: Schema.Literal('cancelled', 'unavailable', 'denied'),
  }),
)
```

```ts
// core/src/features/execution/contract.ts
import type { Run, Event } from '#core/features/execution/api/schema'

export type Execution = {
  run(
    input: typeof Run.Type,
    options: { signal: AbortSignal },
  ): AsyncIterable<typeof Event.Type>
}
```

The capability's function signature is defined once here; its data types derive from the API owner. Local and sandbox implementations satisfy the same `Execution` contract. Runtime schema decoding belongs at untrusted input/output boundaries; an inferred TypeScript annotation alone does not validate a socket message. Complete the protocol with typed declared errors, terminal-event rules, output limits, backpressure, and cancellation behavior before shipping it. `AsyncIterable` does not make thrown transport failures statically typed.

Keep implementation and schemas colocated by feature:

```text
core/src/features/execution/
  api/
    schema.ts       # only public task/event/error data definitions
    rpc.ts          # wire operations using those exact schemas
    index.ts        # binds authorized services
  contract.ts       # Execution capability, data types inferred above
  service.ts        # authorization and task lifecycle
  worker.ts         # shared task dispatch/reporting protocol
  node/index.ts     # actual local process implementation
  sandbox/index.ts  # sandbox implementation behind owned adapter
```

The package publishes only deliberate consumption entry points. A source folder is not automatically a public export. Process dependencies stay in `core/execution/node`; sandbox vendor dependencies stay in their owned adapter. Neither reaches a browser SDK root.

## Bind execution at the host

These snippets show proposed owned host APIs. `startWorker` represents one process-lifetime integration, not another manually assembled product SDK. Its `client` argument is the complete inferred root client; the worker internally consumes the API-declared task/event operations and handles transport details.

```ts
// CLI worker composition: this process owns a local execution capability.
import { createClient } from '@example/client-sdk'
import { startWorker } from '@example/core/execution'
import { createLocalExecution } from '@example/core/execution/node'

await using client = createClient({ baseUrl, credentials: workerCredentials })
await using execution = createLocalExecution({ workspace: approvedWorkspace })
await using worker = await startWorker({ client, execution })

await worker.closed
```

```ts
// Sandbox worker composition: the shared dispatch code is identical.
import { createClient } from '@example/client-sdk'
import { startWorker } from '@example/core/execution'
import { createSandboxExecution } from '@example/core/execution/sandbox'

await using client = createClient({ baseUrl, credentials: workerCredentials })
await using execution = createSandboxExecution({ sandbox: assignedSandbox })
await using worker = await startWorker({ client, execution })

await worker.closed
```

Credentials and workspace/sandbox assignments above are resolved, scoped host inputs. These proposed owned handles implement `Symbol.asyncDispose`; `await using` disposes acquired handles in reverse order, including when later acquisition fails. Adapters must release any resources acquired internally before a factory rejects; use the owned Effect scope internally. Hosts without explicit resource-management support use the equivalent owned scope integration. This lifecycle API still needs implementation and verification. Check the target compiler/runtime support for [TypeScript explicit resource management](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html).

The worker accepts only tasks authorized for that worker, session, and workspace. Resolve `workspaceId` against its assigned scope; do not turn it into an arbitrary filesystem path. A socket reconnect must not silently rerun a Bash command: operation identity, acknowledgement, deduplication, and ambiguous completion are protocol decisions owned below consumers. Validate and authorize first; then call the injected `execution.run`. A connected socket alone grants no execution privilege.

Client UI still calls the product's normal chat/session methods. It does not reconstruct worker events, spawn processes, or select a sandbox vendor. An implementation can change transport without changing that product call, provided it preserves the declared semantics.

## Network and in-process consumption

A trusted host may execute through the same API in memory. Keep runtime selection in an explicit server/host integration, preserving schemas, middleware, identity, service authorization, error mapping, and cancellation. An in-process optimization must not become a private DB shortcut available to every client.

The root SDK should accept a deliberate owned transport binding when needed. Infer operations from the same API rather than creating separate local and remote method catalogs. Direct authorized core access remains an explicit lower-level capability for trusted compositions that truly need it; it is not how ordinary RSC features fetch data.

## Example of a future coding SDK

OpenCode is one illustration of the complexity we may need later: separate client creation for an existing server, server creation with an optional connected client, and explicit lifecycle ownership. Its [v2 constructor source](https://github.com/anomalyco/opencode/blob/dev/packages/sdk/js/src/v2/index.ts) illustrates the combined case. The relevant idea is that callers can use either side independently or compose both. This does not select OpenCode as a dependency or prescribe its internals for our architecture.

## Acceptance for a portable harness

- Build the second client using public SDK imports only; no app-source access or duplicated schema/semantic helper.
- Run the same task-contract suite with local, sandbox, and deterministic fake execution implementations. Validate scope isolation, output, completion, cancellation, unavailable runtime, and disconnect behavior.
- Prove network and in-process API paths enforce the same public contract and service authorization.
- Test reconnect ambiguity explicitly; never assume all commands can be retried safely.
- Verify browsers cannot reach process/sandbox credentials or implementations through the SDK export graph.
- Measure typecheck/IDE latency, cold startup, per-call overhead, and stream memory/backpressure with representative client and API sizes. Set concrete budgets for the product and record regressions; this kit invents no universal millisecond target.
