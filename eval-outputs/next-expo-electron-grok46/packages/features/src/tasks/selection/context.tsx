'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'

export type TaskId = InputOf<Query['tasks']['byId']>['id']
type TaskIdValue = TaskId | Promise<TaskId>

const TaskIdContext = createContext<TaskIdValue | null>(null)

export function TaskIdProvider({ value, children }: {
  value: TaskIdValue
  children: ReactNode
}) {
  return <TaskIdContext value={value}>{children}</TaskIdContext>
}

export function useTaskId(): TaskId {
  const value = use(TaskIdContext)
  if (value === null) throw new Error('TaskIdProvider is required')
  return typeof value === 'string' ? value : use(value)
}

type SelectionContract = {
  state: { selectedId: TaskId | null }
  actions: { select(id: TaskId): void }
}

const SelectionContext = createContext<SelectionContract | null>(null)

export function TaskSelectionProvider({ value, children }: {
  value: SelectionContract
  children: ReactNode
}) {
  return <SelectionContext value={value}>{children}</SelectionContext>
}

export function useTaskSelection(): SelectionContract {
  const value = use(SelectionContext)
  if (value === null) throw new Error('TaskSelectionProvider is required')
  return value
}
