'use client'

import { ErrorState } from '@example/design-system/react'
import { interpretNoteError, noteErrorCopy } from '#features/notes/react/interpret-note-error'

export function NoteListError({ error }: { error: unknown }) {
  return <ErrorState>{noteErrorCopy(interpretNoteError(error))}</ErrorState>
}
