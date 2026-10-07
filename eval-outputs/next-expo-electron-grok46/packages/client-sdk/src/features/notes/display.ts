import type { NoteStatus } from '@example/core/notes/schema'

type StatusDisplay = {
  messageKey: string
  tone: 'neutral' | 'info' | 'positive' | 'danger'
  order: number
}

const display = {
  draft: { messageKey: 'note.draft', tone: 'neutral', order: 0 },
  published: { messageKey: 'note.published', tone: 'positive', order: 1 },
  archived: { messageKey: 'note.archived', tone: 'info', order: 2 },
} as const satisfies Record<NoteStatus, StatusDisplay>

export function getDisplayStatus(status: NoteStatus) {
  return display[status]
}
