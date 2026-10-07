import { Schema } from '@example/libraries/effect'

export const TransportFailed = Schema.Struct({
  _tag: Schema.Literal('client.transport-failed'),
  operation: Schema.String,
})
export type TransportFailed = typeof TransportFailed.Type
