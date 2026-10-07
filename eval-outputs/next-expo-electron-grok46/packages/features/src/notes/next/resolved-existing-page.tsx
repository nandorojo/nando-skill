import { Prefetch } from '@example/client-sdk/rsc'
import { Schema } from '@example/libraries/effect'
import { NoteId } from '@example/core/notes/schema'
import { getQueryClient } from '#features/app/next/query-client'
import { getRequestQuery, reportPrefetchSetupError } from '#features/app/next/request'
import { NoteForId } from '#features/notes/react/note-for-id'

export async function ResolvedExistingNotePage({ params }: { params: Promise<{ id: string }> }) {
  const raw = await params
  const { id } = Schema.decodeUnknownSync(NoteId)(raw)
  return (
    <Prefetch
      client={getQueryClient()}
      queryApi={getRequestQuery()}
      reportSetupError={reportPrefetchSetupError}
      query={async ({ client, query }) => {
        void client.prefetchQuery(query.notes.byId.getOptions({ id }))
        void client.prefetchQuery(query.notes.list.getOptions(undefined))
      }}
    >
      <NoteForId id={id} />
    </Prefetch>
  )
}
