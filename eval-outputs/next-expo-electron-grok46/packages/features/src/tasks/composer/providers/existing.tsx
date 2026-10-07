'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import type { ReactNode } from '@example/libraries/react'
import { ComposerProvider } from '#features/tasks/composer/context'
import { useExistingComposer } from '#features/tasks/composer/use-existing-composer'

type TaskId = InputOf<Query['tasks']['byId']>['id']

export function ExistingTaskComposerProvider({ taskId, children }: {
  taskId: TaskId
  children: ReactNode
}) {
  const value = useExistingComposer({ taskId })
  return <ComposerProvider value={value}>{children}</ComposerProvider>
}
