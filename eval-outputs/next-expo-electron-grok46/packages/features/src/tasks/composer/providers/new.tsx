'use client'

import type { ReactNode } from '@example/libraries/react'
import { ComposerProvider } from '#features/tasks/composer/context'
import { useNewComposer } from '#features/tasks/composer/use-new-composer'

export function NewTaskComposerProvider({ onCreated, children }: {
  onCreated(id: string): void
  children: ReactNode
}) {
  const value = useNewComposer({ onCreated })
  return <ComposerProvider value={value}>{children}</ComposerProvider>
}
