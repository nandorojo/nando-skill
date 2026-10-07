import { Effect } from '@example/libraries/effect'
import type { Actor } from '../auth/actor'
import type { NotesScope } from './db'

export function requireNoteRead(actor: Actor): Effect.Effect<NotesScope> {
  return Effect.succeed({ workspaceId: actor.workspaceId })
}

export function requireNoteWrite(actor: Actor): Effect.Effect<NotesScope> {
  return Effect.succeed({ workspaceId: actor.workspaceId })
}
