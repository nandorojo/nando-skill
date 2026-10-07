'use client'

import type { ReactNode } from '@example/libraries/react'
import { ComposerProvider } from '#features/notes/composer/context'
import { useNewComposer } from '#features/notes/composer/use-new-composer'

export function NewNoteComposerProvider({ onCreated, children }: {
  onCreated(id: string): void
  children: ReactNode
}) {
  const value = useNewComposer({ onCreated })
  return <ComposerProvider value={value}>{children}</ComposerProvider>
}
