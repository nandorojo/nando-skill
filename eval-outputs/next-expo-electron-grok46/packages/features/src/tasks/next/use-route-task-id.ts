'use client'

import { TaskId } from '@example/core/tasks/schema'
import { Schema } from '@example/libraries/effect'
import { useParams } from '@example/libraries/navigation/next'
import type { TaskId as TaskIdValue } from '../selection/context'

export function useRouteTaskId(): TaskIdValue {
  const params = useParams<{ id: string }>()
  return Schema.decodeUnknownSync(TaskId)({ id: String(params.id) }).id
}
