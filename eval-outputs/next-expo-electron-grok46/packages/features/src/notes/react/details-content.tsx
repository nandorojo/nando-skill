'use client'

import { Stack, Text } from '@example/design-system/react'
import type { Note } from '@example/core/notes/schema'
import { NoteStatusLabel } from '#features/notes/react/status'

export function NoteDetailsContent({ note }: { note: Note }) {
  return (
    <Stack className="gap-2">
      <Text>{note.title}</Text>
      <NoteStatusLabel status={note.status} />
      <Text>{note.body}</Text>
    </Stack>
  )
}
