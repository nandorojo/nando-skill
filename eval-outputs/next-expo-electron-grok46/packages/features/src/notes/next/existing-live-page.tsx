import { Suspense } from '@example/libraries/react'
import { NoteDetailsPending } from '#features/notes/react/details-pending'
import { NotesPageShell } from '#features/notes/next/page-shell'
import { RouteExistingNote } from '#features/notes/next/route-existing-note'

export function NotesExistingLivePage() {
  return (
    <NotesPageShell>
      <Suspense fallback={<NoteDetailsPending />}>
        <RouteExistingNote />
      </Suspense>
    </NotesPageShell>
  )
}
