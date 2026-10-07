# Grok 4.6 skill-following eval

This folder is **not a real product**. It is an evaluation of Grok 4.6's ability to follow [`fernando-product-engineering`](../../skills/fernando-product-engineering/SKILL.md) end to end.

The question is: given only that skill (and its references), can the model produce the intended consumption story — contracts first, feature colocation, derived clients, headless React, and three host apps — without inventing a second architecture?

API routes, persistence, and screens are **structural mocks**. They exist so a reviewer can walk the files against the skill. They do not save notes, talk to a database, or claim production behavior. Mock providers are explicit preview implementers, not hidden happy-path fallbacks.

## What this eval covers

Two features, each with create and existing/edit compositions of the same parts:

| Feature | Create screen | Existing / edit screen | Mutations |
| --- | --- | --- | --- |
| Notes | `NewNoteScreen` | `ExistingNoteScreen` | `notes.create`, `notes.update` |
| Tasks | `NewTaskScreen` | `ExistingTaskScreen` | `tasks.create`, `tasks.update` |

Three hosts consume the same SDK and portable UI:

```text
apps/web        Next.js App Router — thin pages + API mount
apps/native     Expo Router — thin screens
apps/electron   Desktop SPA — same features, no RSC
```

Package aliases match the skill (`@example/*`). This workspace is isolated; it does not implement the kit.

## Tree

```text
packages/
  libraries/           owned React, Effect, Query, navigation facades
  design-system/       vanilla tokens + web/native component contracts
  core/                notes + tasks + auth + execution (schema → db → service → api)
  api/                 composed RPC, live layer, next/bun hosts
  rpc/                 inferred client types + runtime binding
  client-sdk/          createClient, display semantics, ./react query surface
  features/            portable UI, host integrations, app providers
apps/
  web/                 Next entry points
  native/              Expo entry points
  electron/            Electron main + renderer
```

## How to review it

Walk one vertical slice (notes) through the skill's sequence, then confirm tasks copies the same boundaries:

1. **Consumer first** — `features/src/notes/screens/react/{new,existing}.tsx` and independently imported Next pages in `features/src/notes/next/`
2. **Owned dependencies** — `packages/libraries/src/*`
3. **Schema → DB → service → API** — `packages/core/src/features/notes/`
4. **Composed API + client-safe RPC** — `packages/api/src/{index.ts,rpc,live.ts}`
5. **One root client + derived query helpers** — `packages/client-sdk/src/`
6. **Headless contracts + mock implementers** — `features/src/notes/composer/`
7. **Host adapters** — `features/src/notes/{next,native,electron}/` and `apps/*`

Then ask the skill's acceptance question: could another client implement the product from `@example/client-sdk` without copying app logic?

## What this is not

- Not compiled, installed, or executed. Export maps point at `src` so the mock is readable; a real product would publish `dist`.
- Not the executable contract slice. Behavioral tests live in [`examples/contract-slice`](../contract-slice/README.md).
- Not a claim that Effect RPC, TanStack Query, Expo, or Electron were run here.
- Not a fake production API. The Fetch handler answers `501` on purpose.

## Skill ideas mapped to files

| Skill idea | Where it appears |
| --- | --- |
| One definition of each type | `core/.../api/schema.ts` |
| Wire declaration vs mounted API | `api/rpc.ts` vs `api/index.ts` |
| One named service class | `NotesService`, `TasksService` |
| Service authorizes, DB applies scope | `service.ts` + `policy.ts` + `db.ts` |
| Type-only server `Api`, runtime `ApiRpc` | `rpc/src/types.ts` vs `rpc/src/client.ts` |
| `createClient()` + `createQuery()` | `client-sdk` root and `./react` |
| `InputOf` / `OutputOf` / `ResourceOf` | `client-sdk` inference helpers |
| Query keys from operations; `exact: true` | `client-sdk/react/query.ts` |
| One `setMutationDefaults` installer | `client-sdk/react/mutation-defaults.ts` |
| Domain meaning in the SDK | `client-sdk/features/{notes,tasks}/display.ts` |
| Feature hooks wrap Query | `features/.../use-*-by-id.ts`, `use-update-*.ts` |
| Legal pending / empty / error / content | `features/.../details.tsx`, `list.tsx` |
| Headless `state` / `actions` / `meta` | composer `contract.ts` + context |
| New vs existing vs mock providers | `composer/providers/*` |
| One state owner per provider wrapper | `workspace/react/*` |
| Compound parts, no mode booleans | screens compose `Notes.*` / `Tasks.*` |
| Web/native DS contracts | `design-system` `index.tsx` + `index.native.tsx` |
| Routing injected at host integration | `features/.../{next,native,electron}` |
| RSC shell never awaits | `features/src/notes/next/existing-page.tsx` |
| Official Query mounting | `features/src/app/next/{query-client,query-provider}.tsx` |
| Apps import features only | `apps/web`, `apps/native`, `apps/electron` |
| Execution injected at the host | `core/.../execution` + Electron main |
| Vanilla roots, slash adapters | every `package.json` `exports` map |

## Status

This is a **design-shaped mock** for scoring skill adherence. If a later model pass is asked to make it compile, the contracts and folders should stay; only the Effect/Query/host adapters should become real.

## Repaired against this review

A later pass applied the RCA in [review 1](review-1.md) and the updated skill. Review 1 preserves the earlier findings; review 2 assesses the revised files. The current checkout does not provide an original-source commit for a reproducible code diff.

| Review finding | Change |
| --- | --- |
| Many pages in one file | `notes/next/{new,existing,existing-live}-page.tsx` plus `index.ts`; same for tasks |
| Keep useful wrappers | `page-shell.tsx` owns workspace/list Suspense; `resolved-existing-page.tsx` owns params + prefetch |
| `#` / public imports | Features use `#features/...`; apps use `@example/features/...` |
| Thin apps | Homes and Electron routes moved into `features/app/<host>`; app manifests declare only what they import |
| Prefetch ownership | `Prefetch` now lives in `@example/client-sdk/rsc` |
| QueryProvider filename | `features/src/app/next/query-provider.tsx` |
| Refresh errors | Details/list keep data and render `ErrorNotice` beside it |
| Shared DS states | `PendingState`, `ErrorState`, `EmptyState`, `ErrorNotice` |
| Error codes | `notes.unavailable`, `notes.wrong-team`, `notes.rejected` (and task equivalents) |
| Electron `onCreated` | Removed from existing pages; create pages navigate through host adapters |
| Flat `id` props | `NoteDetails({ id })`, `NoteForId({ id })` |
| Composer actions | `patch` / `replace` / `reset`; `canSubmit` and submission live in `meta` |
| `NoteId` typing | Scalar `InputOf<Query['notes']['byId']>['id']` |
| `messages.tsx` | Replaced by portable `note-for-id.tsx` and Next-only `route-existing-note.tsx` |
| Next barrels | `apps/web/next.config.ts` records `optimizePackageImports` (unverified; no production build) |

Walk the repaired notes Next slice from [`new-page.tsx`](packages/features/src/notes/next/new-page.tsx) and [`existing-page.tsx`](packages/features/src/notes/next/existing-page.tsx).

## Review reports

- [Review 1 — original generation and skill RCA](review-1.md)
- [Review 2 — independent grading of the revised example](review-2.md)
