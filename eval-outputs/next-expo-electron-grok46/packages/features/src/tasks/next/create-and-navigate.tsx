'use client'

import { useRouter } from '@example/libraries/navigation/next'
import { NewTaskScreen } from '#features/tasks/screens/react/new'

export function CreateTaskAndNavigate() {
  const router = useRouter()
  return <NewTaskScreen onCreated={id => { router.push(`/tasks/${id}`) }} />
}
