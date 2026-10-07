import { Suspense } from '@example/libraries/react'
import { NoteDetailsPending } from '#features/notes/react/details-pending'
import { NotesPageShell } from '#features/notes/next/page-shell'
import { ResolvedExistingNotePage } from '#features/notes/next/resolved-existing-page'

export function NotesExistingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <NotesPageShell>
      <Suspense fallback={<NoteDetailsPending />}>
        <ResolvedExistingNotePage params={params} />
      </Suspense>
    </NotesPageShell>
  )
}
