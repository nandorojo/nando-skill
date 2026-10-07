'use client'

import { NotesWorkspaceProvider } from '#features/notes/workspace/react/index'
import { NoteForId } from '#features/notes/react/note-for-id'
import { useRouteNoteId } from '#features/notes/native/use-route-note-id'

export function NativeExistingNoteScreen() {
  const id = useRouteNoteId()
  return (
    <NotesWorkspaceProvider>
      <NoteForId id={id} />
    </NotesWorkspaceProvider>
  )
}
