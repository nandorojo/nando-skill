import { Effect } from '@example/libraries/effect'
import type { Actor } from '../auth/actor'
import type { TasksScope } from './db'

export function requireTaskRead(actor: Actor): Effect.Effect<TasksScope> {
  return Effect.succeed({ workspaceId: actor.workspaceId })
}

export function requireTaskWrite(actor: Actor): Effect.Effect<TasksScope> {
  return Effect.succeed({ workspaceId: actor.workspaceId })
}
