'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import { TasksWorkspaceProvider } from '#features/tasks/workspace/react/index'
import { TaskForId } from '#features/tasks/react/task-for-id'

export function ElectronExistingTaskPage({
  taskId,
}: {
  taskId: InputOf<Query['tasks']['byId']>['id']
}) {
  return (
    <TasksWorkspaceProvider>
      <TaskForId id={taskId} />
    </TasksWorkspaceProvider>
  )
}
