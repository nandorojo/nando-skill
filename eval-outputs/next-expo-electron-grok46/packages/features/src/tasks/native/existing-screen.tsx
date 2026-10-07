'use client'

import { TaskId } from '@example/core/tasks/schema'
import { Schema } from '@example/libraries/effect'
import { useLocalSearchParams } from '@example/libraries/navigation/native'
import { TasksWorkspaceProvider } from '#features/tasks/workspace/react/index'
import { TaskForId } from '#features/tasks/react/task-for-id'

export function NativeExistingTaskScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = Schema.decodeUnknownSync(TaskId)({ id: String(params.id) }).id
  return (
    <TasksWorkspaceProvider>
      <TaskForId id={id} />
    </TasksWorkspaceProvider>
  )
}
