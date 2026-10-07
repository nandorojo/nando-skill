import { Context, Schema } from '@example/libraries/effect'

export const Actor = Schema.Struct({
  id: Schema.String,
  workspaceId: Schema.String,
})
export type Actor = typeof Actor.Type

export class CurrentActor extends Context.Tag('CurrentActor')<CurrentActor, Actor>() {}
