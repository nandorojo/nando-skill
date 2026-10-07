import { Prefetch } from '@example/client-sdk/rsc'
import { Schema } from '@example/libraries/effect'
import { TaskId } from '@example/core/tasks/schema'
import { getQueryClient } from '#features/app/next/query-client'
import { getRequestQuery, reportPrefetchSetupError } from '#features/app/next/request'
import { TaskForId } from '#features/tasks/react/task-for-id'

export async function ResolvedExistingTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const raw = await params
  const { id } = Schema.decodeUnknownSync(TaskId)(raw)
  return (
    <Prefetch
      client={getQueryClient()}
      queryApi={getRequestQuery()}
      reportSetupError={reportPrefetchSetupError}
      query={async ({ client, query }) => {
        void client.prefetchQuery(query.tasks.byId.getOptions({ id }))
        void client.prefetchQuery(query.tasks.list.getOptions(undefined))
      }}
    >
      <TaskForId id={id} />
    </Prefetch>
  )
}
