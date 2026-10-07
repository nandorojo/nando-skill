'use client'

import { ErrorNotice } from '@example/design-system/react'
import { interpretNoteError, noteErrorCopy } from '#features/notes/react/interpret-note-error'

export function NoteListErrorNotice({ error }: { error: unknown }) {
  return <ErrorNotice>{noteErrorCopy(interpretNoteError(error))}</ErrorNotice>
}
