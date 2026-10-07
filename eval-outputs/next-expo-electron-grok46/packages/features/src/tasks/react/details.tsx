'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import { EmptyState, ErrorNotice, ErrorState, PendingState, Stack, Text } from '@example/design-system/react'
import type { Task } from '@example/core/tasks/schema'
import { TaskStatusLabel } from '#features/tasks/react/status'
import { useTaskById } from '#features/tasks/react/use-task-by-id'

export function TaskDetailsContent({ task }: { task: Task }) {
  return (
    <Stack className="gap-2">
      <Text>{task.title}</Text>
      <TaskStatusLabel status={task.status} />
      <Text>{task.description}</Text>
    </Stack>
  )
}

export function TaskDetailsPending() {
  return <PendingState>Loading task</PendingState>
}

export function TaskDetails({ id }: { id: InputOf<Query['tasks']['byId']>['id'] }) {
  const task = useTaskById({ id })
  if (task.data !== undefined) {
    return (
      <Stack className="gap-2">
        <TaskDetailsContent task={task.data} />
        {task.status === 'error' ? <ErrorNotice>Could not refresh this task</ErrorNotice> : null}
      </Stack>
    )
  }
  if (task.status === 'error') return <ErrorState>Task unavailable</ErrorState>
  if (task.fetchStatus === 'fetching') return <TaskDetailsPending />
  if (task.fetchStatus === 'paused') return <PendingState>Task fetch paused</PendingState>
  return <EmptyState>Task not requested</EmptyState>
}
