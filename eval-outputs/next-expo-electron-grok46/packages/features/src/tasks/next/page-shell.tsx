import { Suspense, type ReactNode } from '@example/libraries/react'
import { TasksWorkspaceProvider } from '#features/tasks/workspace/react/index'
import { TaskListPending } from '#features/tasks/react/list'

export function TasksPageShell({ children }: { children: ReactNode }) {
  return (
    <TasksWorkspaceProvider>
      <Suspense fallback={<TaskListPending />}>
        {children}
      </Suspense>
    </TasksWorkspaceProvider>
  )
}
