import { CreateNoteAndNavigate } from '#features/notes/next/create-and-navigate'
import { NotesPageShell } from '#features/notes/next/page-shell'

export function NotesNewPage() {
  return (
    <NotesPageShell>
      <CreateNoteAndNavigate />
    </NotesPageShell>
  )
}
