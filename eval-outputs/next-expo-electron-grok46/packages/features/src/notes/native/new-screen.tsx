'use client'

import { NotesWorkspaceProvider } from '#features/notes/workspace/react/index'
import { NewNoteScreen } from '#features/notes/screens/react/new'
import { useRouter } from '@example/libraries/navigation/native'

export function NativeNewNoteScreen() {
  const router = useRouter()
  return (
    <NotesWorkspaceProvider>
      <NewNoteScreen onCreated={id => { router.push(`/notes/${id}`) }} />
    </NotesWorkspaceProvider>
  )
}
