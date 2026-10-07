'use client'

import { useState, type ReactNode } from '@example/libraries/react'
import { TaskSelectionProvider, type TaskId } from '../../selection/context'

function TasksWorkspaceSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<TaskId | null>(null)
  return (
    <TaskSelectionProvider
      value={{
        state: { selectedId },
        actions: { select: setSelectedId },
      }}
    >
      {children}
    </TaskSelectionProvider>
  )
}

export function TasksWorkspaceProvider({ children }: { children: ReactNode }) {
  return (
    <TasksWorkspaceSelectionProvider>
      {children}
    </TasksWorkspaceSelectionProvider>
  )
}
