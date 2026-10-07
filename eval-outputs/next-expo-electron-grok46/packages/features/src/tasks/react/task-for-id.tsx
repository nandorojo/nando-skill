'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import { TaskIdProvider } from '#features/tasks/selection/context'
import { ExistingTaskScreen } from '#features/tasks/screens/react/existing'

export function TaskForId({ id }: { id: InputOf<Query['tasks']['byId']>['id'] }) {
  return (
    <TaskIdProvider value={id}>
      <ExistingTaskScreen />
    </TaskIdProvider>
  )
}
