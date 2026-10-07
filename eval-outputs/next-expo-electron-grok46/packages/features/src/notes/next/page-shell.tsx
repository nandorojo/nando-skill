import { Suspense, type ReactNode } from '@example/libraries/react'
import { NotesWorkspaceProvider } from '#features/notes/workspace/react/index'
import { NoteListPending } from '#features/notes/react/list-pending'

export function NotesPageShell({ children }: { children: ReactNode }) {
  return (
    <NotesWorkspaceProvider>
      <Suspense fallback={<NoteListPending />}>
        {children}
      </Suspense>
    </NotesWorkspaceProvider>
  )
}
