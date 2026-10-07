'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import type { ReactNode } from '@example/libraries/react'
import { ComposerProvider } from '#features/notes/composer/context'
import { useExistingComposer } from '#features/notes/composer/use-existing-composer'

type NoteId = InputOf<Query['notes']['byId']>['id']

export function ExistingNoteComposerProvider({ noteId, children }: {
  noteId: NoteId
  children: ReactNode
}) {
  const value = useExistingComposer({ noteId })
  return <ComposerProvider value={value}>{children}</ComposerProvider>
}
