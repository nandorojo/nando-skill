'use client'

import { ErrorNotice } from '@example/design-system/react'
import { interpretNoteError, noteErrorCopy } from '#features/notes/react/interpret-note-error'

export function NoteDetailsErrorNotice({ error, onRetry }: { error: unknown; onRetry?(): void }) {
  return <ErrorNotice onRetry={onRetry}>{noteErrorCopy(interpretNoteError(error))}</ErrorNotice>
}
