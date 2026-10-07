# Executable contract slice

This legacy fixture makes schema-independent behaviors executable using Zod and
schema-derived TypeScript types. **The selected product stack is Effect RPC with
Effect Schema. This fixture has not been migrated and does not validate that
integration.** It demonstrates authorization, state normalization and stream
assembly behavior without inventing Effect or React APIs or a second RPC facade.

```text
contract-slice/
  library/schema.ts                    # Owns the legacy Zod dependency
  core/features/
    auth/schema.ts                     # Trusted actor contract
    users/schema.ts                     # User operation inputs/results and DB lookup
    users/service.ts                    # Injected authorized operation
    deployments/schema.ts               # Deployment status contract
    chat/schema.ts                      # Stream event and message contracts
  client/features/
    users/schema.ts                     # Consumer state and adapter snapshot
    users/state.ts                      # Loading/empty/content/error normalization
    deployments/display.ts              # Named domain presentation helpers
    chat/messages.ts                    # Patches -> whole-message snapshots
  contracts.test.ts                    # Behavioral tests and rejected type examples
  test.sh                              # Compile and run using existing dependencies
```

The folders demonstrate ownership boundaries; this is not a complete monorepo or
its final export map. In a real package, DB capabilities belong to server-only
entry points and the client SDK must never export them. A generated SDK, HTTP
adapter, React hooks, and UI features are intentionally outside this fixture.
Schemas live beside their owning feature's operations. There is no central
contracts module, contracts package, or barrel that collects them. Imports point
to specific owners. The direct client-to-core schema imports are local fixture
wiring; production clients obtain public types through the selected SDK boundary
and must never import server-only implementation code.

## Run

From the repository root, with Node 22 or newer, supply an existing dependency directory containing `zod`, `typescript`, and `@types/node`:

```sh
sh eval-outputs/contract-slice/test.sh /absolute/path/to/node_modules
```

The dependency directory is required; the fixture never discovers dependencies in a sibling project.

The script generates a temporary TypeScript configuration, compiles with strict
checking, runs Node's test runner, and removes all compiled output on exit. It
does not install dependencies or write to sibling repositories. Verified here
with Node 24.16.0, TypeScript 5.9.2, and Zod 4.3.6. The available Node type package
predates `node:test`, so the test file declares only the small test runner surface
that it uses; product code contains no tooling compatibility declarations.

## What to review

**Consumer contracts precede implementation.** `GetUserInput`, `GetUserResult`,
`UsersState`, and message events all have runtime schemas. Product TypeScript
types derive from those schemas. Callable capabilities such as `UsersDatabase`
remain TypeScript interfaces: a runtime JSON schema does not authenticate a
database object or serialize its functions.
The authorized operation is a direct named ESM export:

```ts
import { getById } from './core/features/users/service'

const result = await getById(db, trustedActor, { id: 'u1' })
```

`db` is the injected capability and `trustedActor` comes from authentication.
There is no service factory or mirror interface repeating the exported function.

**Service calls enforce authorization.** The DB capability deliberately has no
authorization policy. The service validates its input and passes an explicit
lookup scope containing the actor's permitted team IDs together with the user ID.
The database adapter must apply that scope in its query predicate, including
returning no rows for an empty team scope. Deciding permitted teams is service
policy; applying the supplied predicate is database mechanics. The service also
checks the returned ID and team as defense in depth against an incorrect adapter,
then projects an explicit public response.
Unauthorized and missing records both return `unavailable`. The caller must supply
an actor resolved by trusted authentication code, never a request-body actor.
This fixture does not implement session verification, transactional authorization,
or a comprehensive production policy.

**Presentation meaning belongs to the client SDK.** Features can call
the named ESM export `getDisplayStatus('ready')` and receive `{ label: 'Ready', tone:
'positive' }`. The design system decides which color expresses the semantic tone.
The mapping is exhaustive over the schema's enum. Localization is not implemented;
a real multilingual contract could return message keys instead of English labels.

**No data is different from empty data.** `normalizeUsersState` distinguishes:

| Consumer state | Meaning |
| --- | --- |
| `awaiting / idle` | No result; a request has not started |
| `awaiting / paused` | No result; fetching is paused |
| `awaiting / loading` | No result; actively fetching; initial skeleton is appropriate |
| `failed` | No usable result and an error |
| `empty` | A successful empty result exists |
| `content` | A nonempty result exists |

Empty/content states preserve their result while refresh is idle, paused, active,
or failed. A failed refresh records both the error and current retry activity, so
retrying never hides the usable result. `QuerySnapshot` is our own adapter input,
not a claim to match every field in a particular React Query version. Its adapter
must deliberately decide how placeholder data and retained previous-key data are
represented. The content schema uses a tuple with a required first item followed
by zero or more users, so both runtime validation and the inferred TypeScript type
require a nonempty list.

**Streaming clients receive whole messages.** A transport adapter supplies a
`ReadableStream<unknown>` of decoded events. `readMessageSnapshots` validates each
event and applies ordered text appends before yielding immutable snapshots. The
sequence starts at zero, and the terminal `done` event consumes the next sequence.
Wrong IDs, gaps, duplicates, invalid shapes, events pushed after completion, and
truncated streams are rejected. Invalid events cannot advance assembler state.
An abort cancels a pending read; early consumer exit releases the source as well.
Cleanup errors cannot mask an earlier protocol or abort failure, but remain
observable when no earlier failure exists.

The reader ends at the first valid `done` event and cancels remaining input; it does
not inspect events beyond that message's terminal event. Stream cancellation
depends on the transport honoring the standard stream cancellation contract.
This is deliberately a single-message, append-text protocol, not JSON Patch,
resumable streaming, byte/SSE framing, retries, idempotency, or multiplexing.

## Behavioral coverage

The tests cover input validation before DB access; tenant scope propagation;
authorized, unauthorized, and missing users; incorrect adapter results;
public-field projection; exhaustive display metadata; pending idle,
paused and loading states; empty results; background refresh; initial errors and
stale refresh errors; immutable stream snapshots; message IDs and sequence checks;
malformed and truncated events; abort during a pending read; pre-aborted signals;
cleanup when the consumer exits early; and preservation of primary failures when
cleanup also fails. TypeScript also verifies that unknown
deployment statuses and successful snapshots without data are rejected.
