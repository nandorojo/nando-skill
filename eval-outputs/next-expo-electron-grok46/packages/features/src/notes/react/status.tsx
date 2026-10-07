'use client'

import { Notes } from '@example/client-sdk'
import { Badge } from '@example/design-system/react'
import type { NoteStatus } from '@example/core/notes/schema'

export function NoteStatusLabel({ status }: { status: NoteStatus }) {
  const descriptor = Notes.getDisplayStatus(status)
  return <Badge tone={descriptor.tone}>{descriptor.messageKey}</Badge>
}
