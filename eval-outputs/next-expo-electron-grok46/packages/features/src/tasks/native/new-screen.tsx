'use client'

import { useRouter } from '@example/libraries/navigation/native'
import { TasksWorkspaceProvider } from '#features/tasks/workspace/react/index'
import { NewTaskScreen } from '#features/tasks/screens/react/new'

export function NativeNewTaskScreen() {
  const router = useRouter()
  return (
    <TasksWorkspaceProvider>
      <NewTaskScreen onCreated={id => { router.push(`/tasks/${id}`) }} />
    </TasksWorkspaceProvider>
  )
}
