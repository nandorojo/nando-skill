import { Suspense } from '@example/libraries/react'
import { TaskDetailsPending } from '#features/tasks/react/details'
import { TasksPageShell } from '#features/tasks/next/page-shell'
import { ResolvedExistingTaskPage } from '#features/tasks/next/resolved-existing-page'

export function TasksExistingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <TasksPageShell>
      <Suspense fallback={<TaskDetailsPending />}>
        <ResolvedExistingTaskPage params={params} />
      </Suspense>
    </TasksPageShell>
  )
}
