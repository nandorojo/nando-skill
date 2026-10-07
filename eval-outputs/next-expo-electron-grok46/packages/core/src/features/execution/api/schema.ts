import { Schema } from '@example/libraries/effect'

export const Run = Schema.Struct({
  taskId: Schema.String,
  workspaceId: Schema.String,
  command: Schema.String,
})
export type Run = typeof Run.Type

export const Event = Schema.Union(
  Schema.Struct({
    _tag: Schema.Literal('output'),
    taskId: Schema.String,
    stream: Schema.Literal('stdout', 'stderr'),
    text: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal('exited'),
    taskId: Schema.String,
    exitCode: Schema.Number,
  }),
  Schema.Struct({
    _tag: Schema.Literal('failed'),
    taskId: Schema.String,
    reason: Schema.Literal('cancelled', 'unavailable', 'denied'),
  }),
)
export type Event = typeof Event.Type
