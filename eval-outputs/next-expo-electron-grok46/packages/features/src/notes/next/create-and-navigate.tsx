'use client'

import { useRouter } from '@example/libraries/navigation/next'
import { NewNoteScreen } from '#features/notes/screens/react/new'

export function CreateNoteAndNavigate() {
  const router = useRouter()
  return (
    <NewNoteScreen
      onCreated={id => {
        router.push(`/notes/${id}`)
      }}
    />
  )
}
