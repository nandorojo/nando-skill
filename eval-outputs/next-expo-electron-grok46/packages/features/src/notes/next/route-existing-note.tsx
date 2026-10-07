'use client'

import { NoteForId } from '#features/notes/react/note-for-id'
import { useRouteNoteId } from '#features/notes/next/use-route-note-id'

export function RouteExistingNote() {
  const id = useRouteNoteId()
  return <NoteForId id={id} />
}
