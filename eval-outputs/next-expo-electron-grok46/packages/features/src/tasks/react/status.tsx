'use client'

import { Tasks } from '@example/client-sdk'
import { Badge } from '@example/design-system/react'
import type { TaskStatus } from '@example/core/tasks/schema'

export function TaskStatusLabel({ status }: { status: TaskStatus }) {
  const descriptor = Tasks.getDisplayStatus(status)
  return <Badge tone={descriptor.tone}>{descriptor.messageKey}</Badge>
}
