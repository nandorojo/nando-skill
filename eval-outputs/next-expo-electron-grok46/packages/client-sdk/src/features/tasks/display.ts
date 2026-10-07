import type { TaskStatus } from '@example/core/tasks/schema'

type StatusDisplay = {
  messageKey: string
  tone: 'neutral' | 'info' | 'positive' | 'danger'
  order: number
}

const display = {
  open: { messageKey: 'task.open', tone: 'neutral', order: 0 },
  in_progress: { messageKey: 'task.in_progress', tone: 'info', order: 1 },
  done: { messageKey: 'task.done', tone: 'positive', order: 2 },
} as const satisfies Record<TaskStatus, StatusDisplay>

export function getDisplayStatus(status: TaskStatus) {
  return display[status]
}
