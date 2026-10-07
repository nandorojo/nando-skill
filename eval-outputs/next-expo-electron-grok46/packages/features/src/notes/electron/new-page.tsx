'use client'

import { NotesWorkspaceProvider } from '#features/notes/workspace/react/index'
import { NewNoteScreen } from '#features/notes/screens/react/new'
import { updateHashRoute } from '@example/libraries/navigation/electron'

export function ElectronNewNotePage() {
  return (
    <NotesWorkspaceProvider>
      <NewNoteScreen onCreated={id => { updateHashRoute(`/notes/${id}`) }} />
    </NotesWorkspaceProvider>
  )
}
