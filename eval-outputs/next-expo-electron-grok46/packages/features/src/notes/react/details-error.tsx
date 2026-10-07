'use client'

import { ErrorState } from '@example/design-system/react'
import { interpretNoteError, noteErrorCopy } from '#features/notes/react/interpret-note-error'

export function NoteDetailsError({ error, onRetry }: { error: unknown; onRetry?(): void }) {
  return <ErrorState onRetry={onRetry}>{noteErrorCopy(interpretNoteError(error))}</ErrorState>
}
