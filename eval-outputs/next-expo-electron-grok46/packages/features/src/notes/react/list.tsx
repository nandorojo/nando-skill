'use client'

import { Button, Stack } from '@example/design-system/react'
import { NoteStatusLabel } from '#features/notes/react/status'
import { useNotesList } from '#features/notes/react/use-notes-list'
import { useNoteSelection } from '#features/notes/selection/context'
import { NoteListEmpty } from '#features/notes/react/list-empty'
import { NoteListError } from '#features/notes/react/list-error'
import { NoteListErrorNotice } from '#features/notes/react/list-error-notice'
import { NoteListPending } from '#features/notes/react/list-pending'
import { PendingState } from '@example/design-system/react'
import { EmptyState } from '@example/design-system/react'

export function NoteList() {
  const notes = useNotesList()
  const { actions } = useNoteSelection()

  if (notes.data !== undefined) {
    return (
      <Stack className="gap-2">
        {notes.data.length === 0 ? <NoteListEmpty /> : notes.data.map(note => (
          <Button key={note.id} onPress={() => actions.select(note.id)}>
            <Button.Text>{note.title}</Button.Text>
            <NoteStatusLabel status={note.status} />
          </Button>
        ))}
        {notes.status === 'error' ? <NoteListErrorNotice error={notes.error} /> : null}
      </Stack>
    )
  }
  if (notes.status === 'error') return <NoteListError error={notes.error} />
  if (notes.fetchStatus === 'fetching') return <NoteListPending />
  if (notes.fetchStatus === 'paused') return <PendingState>Notes fetch paused</PendingState>
  return <EmptyState>Notes not requested</EmptyState>
}
