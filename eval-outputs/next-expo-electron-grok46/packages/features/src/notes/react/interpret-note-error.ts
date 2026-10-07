import type { NoteReadError, NoteWriteError } from '@example/core/notes/schema'
import { MockTransportError } from '@example/client-sdk'
import { assertNever } from '@example/libraries/react'

export type NoteFailure = NoteReadError | NoteWriteError | { _tag: 'client.transport-failed' }

export function interpretNoteError(error: unknown): NoteFailure {
  if (error instanceof MockTransportError) {
    return { _tag: 'client.transport-failed' }
  }
  if (typeof error === 'object' && error !== null && '_tag' in error) {
    const tag = error._tag
    if (tag === 'notes.unavailable') return error as NoteReadError
    if (tag === 'notes.wrong-team') return error as NoteReadError
    if (tag === 'notes.rejected') return error as NoteWriteError
  }
  return { _tag: 'client.transport-failed' }
}

export function noteErrorCopy(error: NoteFailure): string {
  switch (error._tag) {
    case 'notes.unavailable':
      return 'This note is unavailable'
    case 'notes.wrong-team':
      return 'Switch to the authorized team to view this note'
    case 'notes.rejected':
      return error.message
    case 'client.transport-failed':
      return 'The note client could not reach the API'
    default:
      return assertNever(error)
  }
}
