'use client'

import { updateHashRoute } from '@example/libraries/navigation/electron'
import { TasksWorkspaceProvider } from '#features/tasks/workspace/react/index'
import { NewTaskScreen } from '#features/tasks/screens/react/new'

export function ElectronNewTaskPage() {
  return (
    <TasksWorkspaceProvider>
      <NewTaskScreen onCreated={id => { updateHashRoute(`/tasks/${id}`) }} />
    </TasksWorkspaceProvider>
  )
}
