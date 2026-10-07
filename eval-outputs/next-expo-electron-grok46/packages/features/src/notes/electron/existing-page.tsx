'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import { NotesWorkspaceProvider } from '#features/notes/workspace/react/index'
import { NoteForId } from '#features/notes/react/note-for-id'

export function ElectronExistingNotePage({
  noteId,
}: {
  noteId: InputOf<Query['notes']['byId']>['id']
}) {
  return (
    <NotesWorkspaceProvider>
      <NoteForId id={noteId} />
    </NotesWorkspaceProvider>
  )
}
