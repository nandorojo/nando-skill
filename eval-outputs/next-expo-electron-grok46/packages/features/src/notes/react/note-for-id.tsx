'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import { NoteIdProvider } from '#features/notes/selection/context'
import { ExistingNoteScreen } from '#features/notes/screens/react/existing'

export function NoteForId({ id }: { id: InputOf<Query['notes']['byId']>['id'] }) {
  return (
    <NoteIdProvider value={id}>
      <ExistingNoteScreen />
    </NoteIdProvider>
  )
}
