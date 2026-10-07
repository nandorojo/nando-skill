import { schema, type Output } from '../../../library/schema'

export const MessageEvent = schema.discriminatedUnion('kind', [
  schema.object({
    kind: schema.literal('append'), messageId: schema.string().min(1),
    sequence: schema.number().int().nonnegative(), text: schema.string(),
  }).strict(),
  schema.object({
    kind: schema.literal('done'), messageId: schema.string().min(1),
    sequence: schema.number().int().nonnegative(),
  }).strict(),
])
export type MessageEvent = Output<typeof MessageEvent>

export const MessageSnapshot = schema.object({
  id: schema.string().min(1), text: schema.string(), complete: schema.boolean(),
}).strict().readonly()
export type MessageSnapshot = Output<typeof MessageSnapshot>
