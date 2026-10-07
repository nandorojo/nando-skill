'use client'

import { Button, EmptyState, ErrorNotice, ErrorState, PendingState, Stack } from '@example/design-system/react'
import { TaskStatusLabel } from '#features/tasks/react/status'
import { useTasksList } from '#features/tasks/react/use-tasks-list'
import { useTaskSelection } from '#features/tasks/selection/context'

export function TaskListPending() {
  return <PendingState>Loading tasks</PendingState>
}

export function TaskList() {
  const tasks = useTasksList()
  const { actions } = useTaskSelection()

  if (tasks.data !== undefined) {
    return (
      <Stack className="gap-2">
        {tasks.data.length === 0
          ? <EmptyState>No tasks yet</EmptyState>
          : tasks.data.map(task => (
            <Button key={task.id} onPress={() => actions.select(task.id)}>
              <Button.Text>{task.title}</Button.Text>
              <TaskStatusLabel status={task.status} />
            </Button>
          ))}
        {tasks.status === 'error' ? <ErrorNotice>Could not refresh tasks</ErrorNotice> : null}
      </Stack>
    )
  }
  if (tasks.status === 'error') return <ErrorState>Tasks unavailable</ErrorState>
  if (tasks.fetchStatus === 'fetching') return <TaskListPending />
  if (tasks.fetchStatus === 'paused') return <PendingState>Tasks fetch paused</PendingState>
  return <EmptyState>Tasks not requested</EmptyState>
}
