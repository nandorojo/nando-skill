# UI states are part of the feature contract

Build states alongside the successful content, using shared design-system parts. A greenfield mock must demonstrate the same meaningful states as a production feature; plain text placeholders are not the default loading/error design.

## Render data first

Decide whether usable data exists before deciding what request activity means. Use the declared absence sentinel (`data === undefined` for the query contracts here), not truthiness or list length. An empty array, zero, or another valid empty result is successful data. If `null` is a valid API result, give it its own documented meaning. Prior-resource data is usable only when identity and authorization permit displaying it; cache retention is not permission to show another tenant's content.

| Data | Activity / outcome | Presentation |
| --- | --- | --- |
| Present, including an empty collection | Idle | Content or the successful empty experience |
| Present | Refetching | Keep content visible; show a subtle refresh indicator only when useful |
| Present | Refresh failed | Keep content visible; show an inline error card/note with appropriate recovery |
| Present list pages | Fetching another page | Keep rows visible; show progress at the continuation/footer |
| Present list pages | Next page failed | Keep rows visible; show a continuation error/retry without implying loaded rows failed |
| Absent | Failed | Blocking error presentation for the affected region |
| Absent | Fetching | Initial loading/skeleton presentation |
| Absent | Paused/offline | Waiting/offline presentation with an honest recovery affordance |
| Absent | Idle/disabled/unresolved input | Not-requested or prerequisite presentation; never an indefinite loading indicator |

An error can coexist with data and renewed fetching; these dimensions are not mutually exclusive. Do not clear content or replace it with a full loading screen on pull-to-refresh, window-focus refresh, retry, or ordinary background refetch. Retain the list's identity, scroll, and interaction state. For a user-requested refresh, acknowledge that action appropriately; quiet background refresh often needs no indicator. Make the choice at the consuming view, based on the actual product/data. Do not subscribe every consumer to fetch activity solely to display a universal spinner.

Do not automatically fall back to a toast for errors. Default to persistent, accessible feedback beside the affected content/action. Use a toast only when the product interaction requires it and an inline location is insufficient. Mutation failures preserve submitted input and previously fetched content. Forms may retain their draft; optimistic chat composers clear immediately and retain failed submissions in the transcript with message-owned retry, without overwriting newer composer input.

## Shared presentation, feature-specific meaning

The design system owns reusable page/region/inline pending, error, empty, and offline primitives: layout, skeletons, accessible status/alert behavior, optional actions, and consistent visual treatment. Implement and expose composable examples of these states in the design system before features copy ad hoc text screens. Names such as `PendingState`, `ErrorState`, `EmptyState`, and `ErrorNotice` below describe responsibilities, not a new mandated component library.

A feature owns the copy, typed error interpretation, recovery action, and content skeleton that depend on its domain. Its small state components compose the DS parts; they must not implement a separate error-card/loading system. Prefer explicit components for genuinely distinct presentations, while sharing their primitive internals.

```text
features/src/notes/react/
  details.tsx              # ordinary hook reader; data-first composition
  details-content.tsx      # NoteDetailsContent receives a resolved note
  details-pending.tsx      # NoteDetailsPending, reusable as Suspense fallback
  details-error.tsx        # blocking typed feature error presenter
  details-error-notice.tsx # typed error alongside retained data
  details-paused.tsx       # no-data waiting presentation
  details-not-requested.tsx
  details-empty.tsx        # only if the feature has a valid empty result
  suspense-details.tsx    # optional distinct suspending reader
```

Each substantial component has its own file and intentional named export. `NoteDetailsContent` receives the resolved domain object, renders successful UI, and does not own fetching or all the request states. `NoteDetails` calls its hook and composes content/state parts. The parts remain public enough for alternate compositions; consumers are not forced through one monolithic query reader.

A composed `NoteDetailsPending` is useful as a single fallback, and its reusable visual pieces remain available where individual panel fallbacks are needed. Put Suspense and the resettable error boundary above the suspending reader. The ordinary and suspending readers reuse the same resolved content, pending presentation, and typed error presentation. A background error with retained data still belongs beside that content under the chosen query error policy; do not throw it just to reuse a blocking error screen.

## Exhaustive workflow dispatch

A product workflow/controller exposes a schema-derived discriminated union of legal states. Put variant-specific fields on their variant: a connected state must not also carry an expired/disconnected reason. Its reader dispatches through an exhaustive switch, with each substantial state presentation in a distinct composable component. An alternative exhaustive matcher requires an equivalently tested profile extension; the bundled rule supports switches. Do not hide workflow selection in ternaries, chained conditions, or an untyped default fallback. Ordinary presentation booleans remain valid; `no-nested-ternary` improves readability but cannot establish legal states or completeness.

```tsx
// Schematic: ConnectionSnapshot is inferred from the SDK-owned runtime schema.
function ConnectionBody({ connection }: { connection: ConnectionSnapshot }) {
  switch (connection.kind) {
    case 'connecting':
      return <ConnectionPending />
    case 'connected':
      return <ConnectionContent handle={connection.handle} />
    case 'disconnected':
      return <ConnectionDisconnected reason={connection.reason} />
    case 'failed':
      return <ConnectionFailure error={connection.error} />
  }
  connection satisfies never
  return null
}
```

`connection satisfies never` checks exhaustiveness at compile time and follows the switch; `return null` completes the renderer without adding a runtime throw. Do not use `assertNever` helpers in React. Validate external states at the SDK boundary and expose typed decode/compatibility failures; this compile-time check is not runtime validation. The bundled workflow-dispatch rule forbids catch-all defaults. Enable the type-aware switch exhaustiveness rule with `considerDefaultExhaustiveForUnions: false`, alongside the workflow-dispatch gate. Add a union variant in a failing type/lint fixture to prove that a missed presentation fails the check. Nested workflow discriminants need the same handling within their owning state component.

This requirement applies to owned workflow states, not a forced normalization of Query's multi-dimensional result. Ordinary Query readers retain the data-first branch order above and share resolved content with Suspense. Declaring a universal `loading | error | success` wrapper would lose meaningful combinations and query tracking.

## Typed failures, not string matching

Backend expected failures have schema-defined globally unique codes and optional typed JSON recovery payloads. SDK transport/unexpected failures have their own controlled variants. See [backend error ownership](contracts-backend.md#typed-failures-and-globally-unique-codes). Feature error presenters exhaustively interpret those variants; DS primitives receive presentation props, not knowledge of every API operation. Do not parse messages, assert unknown errors into a union, or erase all variants into a generic “Something went wrong” branch.

A wrong-team error can offer a switch only when the backend has authorized disclosure of the suggested team. The presenter consumes the already validated payload and a navigation capability; it does not infer access from identifiers.


## Pixels are sacred

Every visible heading, toolbar, button, status line, border, and reserved area must earn its space by helping the user understand or do something meaningful. Start with the user's primary task and protect the space for its content. Do not render UI merely because an API operation, component, provider feature, or internal state exists. Intentional whitespace can support comprehension; redundant chrome and unexplained empty status strips cannot.

Review the complete composed screen, including embedded viewers and third-party UI. A host heading, host toolbar, and embedded toolbar are one experience, not three independently acceptable components. Remove headings that repeat obvious context; preserve accessible region names without requiring a visible title. Avoid stacked containers and separators that announce implementation boundaries instead of product hierarchy.

Give each user intent one clear control. If two controls both say “Reconnect,” either integrate their underlying responsibilities into one reliable action or make a necessary distinction understandable in user terms. Do not expose internal credential renewal versus socket reconnection as competing buttons. Consolidation must preserve working recovery; deleting the functional control while leaving a broken duplicate is not simplification. Prefer supported headless/embedded configuration or an owned integration over cropping an iframe or hiding inaccessible controls with brittle CSS.

Separate essential actions from secondary lifecycle or administrative actions. A desktop viewer does not automatically need a permanently visible “Stop computer” button because its SDK exposes stop. Keep such capabilities available through the API/CLI and, when users need them in the UI, a deliberate secondary location. Choose placement from frequency, consequence, and the actual task. Do not hide a genuinely essential action just to reduce a button count.

Show status when it changes what the user should understand or do. “Viewing computer” adds little above an obviously visible desktop. Failure and recovery remain discoverable and accessible, while ordinary success should usually leave the content alone. Avoid replacing redundant words with unexplained icon-only buttons; retain usable hit targets, focus states, and accessible names.

Visual stability and space efficiency must hold together. Do not solve every possible error by permanently reserving a large blank footer. Reuse an existing compact status/action area or choose another deliberate presentation that preserves adjacent geometry without obscuring content. Check both the ordinary state and the exceptional state, including small viewports and long errors.

For each screen, ask: what can be removed without losing meaning or capability? Is any intent represented twice across host and embed? How much of the viewport serves the primary task? Is every always-visible action worth its permanent cost? Verify the integrated screen, not just each component in isolation.

## Visual continuity across asynchronous states

Avoid unexpected layout shifts from loading, errors, retries, and background updates. Preserve visual continuity inside the region, not merely its outer dimensions: text anchors, alignment, line height, markers, padding, action slots, and neighboring controls should remain stable. A loading label at the top left followed by a centered empty state is a broken transition even if a layout-shift metric reports zero.

Query pending UI subtly introduces the shape of the eventual UI. Reuse the resolved composition's frame and layout primitives; skeletons are optional. Preserve recognizable decoration: a chat's left message marker must also exist in its pending composition, rather than replacing it with an unrelated “Loading conversation…” line. Do not invent successful data or enabled actions before the query resolves. When the outcome is unknown, retain the common frame and place honest pending feedback in its established content area. Real content may naturally grow; avoid movement caused solely by mismatched temporary layouts.

Keep existing content mounted and in place during refetch and refresh errors. Initial errors and offline states use the same region geometry and retain meaningful recovery. Persistent error feedback should use a deliberately allocated area near the affected content/action, with wrapping or accessible overflow, rather than inserting rows that push a desktop, form, or transcript away. Do not hide errors, clip recovery controls, or substitute a transient toast just to pass a geometry check. Reserved space is a product layout decision, not a mandate to add arbitrary blank gaps everywhere.

Mutation progress normally belongs to the trigger that initiated it. Use the shared design-system Button's loading behavior to prevent duplicate submission, communicate busy state accessibly, and dim the existing control. Preserve the trigger's dimensions and position; dimming or disabling alone does not communicate progress. Change the trigger label to meaningful progress text (for example, “Connect desktop” → “Connecting…”) or provide another unmistakable visible progress indicator. If a progress label or spinner replaces it, reserve the label/icon space so neighboring controls do not move. Do not append a separate “Starting…” or “Saving…” row by default. Consume the existing mutation lifecycle directly; no mirrored pending state.

A mutation acknowledgment and the resource's lifecycle are distinct. A restart request may settle while a separate query, poller, or WebSocket still reports “restarting.” Render that later status in an existing stable resource-status location; do not keep a settled mutation artificially pending or let the independent update displace content. Expected user-requested content changes remain valid; temporary feedback must not add unrelated jumps.

Verify transitions, not just isolated screenshots. Hold requests pending deterministically, then exercise success, failure, retry, retained-data refresh failure, and independent resource updates. Compare internal text anchors and control/content bounds on desktop and narrow viewports, and capture representative screenshots for visual review. Check focus, scroll, input retention, accessible busy/error semantics, and long/wrapped messages. Aggregate CLS alone is insufficient: it can miss replaced content, attention jumping between positions, and shifts following user input.

## Acceptance cases

In the adopting product, exercise initial pending, initial paused/disabled, initial error, successful empty/content, retained data while refetching, retained data with a refresh error, and (where relevant) next-page loading/failure. Verify a refresh never replaces existing content with a skeleton, hides loaded rows, or discards the draft. Verify initial error recovery and Suspense pending/error/reset compositions use the same shared parts. Include accessibility and meaningful recovery actions in those examples, and typecheck exhaustive error handling when the API adds a failure variant.

Keep legal-state derivation in the view that needs it. These rendering rules do not require eager normalization of every query result or a new universal state-machine wrapper. Preserve the [tracked query boundary](query-resources.md).
