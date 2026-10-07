import { CreateTaskAndNavigate } from '#features/tasks/next/create-and-navigate'
import { TasksPageShell } from '#features/tasks/next/page-shell'

export function TasksNewPage() {
  return (
    <TasksPageShell>
      <CreateTaskAndNavigate />
    </TasksPageShell>
  )
}
