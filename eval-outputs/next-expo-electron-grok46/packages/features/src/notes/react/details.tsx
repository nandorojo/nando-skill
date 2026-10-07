'use client'

import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import { Stack } from '@example/design-system/react'
import { useNoteById } from '#features/notes/react/use-note-by-id'
import { NoteDetailsContent } from '#features/notes/react/details-content'
import { NoteDetailsError } from '#features/notes/react/details-error'
import { NoteDetailsErrorNotice } from '#features/notes/react/details-error-notice'
import { NoteDetailsNotRequested } from '#features/notes/react/details-not-requested'
import { NoteDetailsPaused } from '#features/notes/react/details-paused'
import { NoteDetailsPending } from '#features/notes/react/details-pending'

export function NoteDetails({ id }: { id: InputOf<Query['notes']['byId']>['id'] }) {
  const note = useNoteById({ id })
  if (note.data !== undefined) {
    return (
      <Stack className="gap-2">
        <NoteDetailsContent note={note.data} />
        {note.status === 'error' ? <NoteDetailsErrorNotice error={note.error} /> : null}
      </Stack>
    )
  }
  if (note.status === 'error') return <NoteDetailsError error={note.error} />
  if (note.fetchStatus === 'fetching') return <NoteDetailsPending />
  if (note.fetchStatus === 'paused') return <NoteDetailsPaused />
  return <NoteDetailsNotRequested />
}
