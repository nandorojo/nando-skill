import { schema, type Output } from '../../../library/schema'

import { User } from '../../../core/features/users/schema'

export const Failure = schema.object({ message: schema.string().min(1) }).strict()
export const FetchStatus = schema.enum(['idle', 'paused', 'fetching'])
export const QuerySnapshot = schema.discriminatedUnion('status', [
  schema.object({ status: schema.literal('pending'), fetchStatus: FetchStatus }).strict(),
  schema.object({
    status: schema.literal('error'), fetchStatus: FetchStatus,
    data: schema.array(User).optional(), error: Failure,
  }).strict(),
  schema.object({
    status: schema.literal('success'), fetchStatus: FetchStatus, data: schema.array(User),
  }).strict(),
])
export type QuerySnapshot = Output<typeof QuerySnapshot>

const Activity = schema.enum(['idle', 'paused', 'loading'])
const Refresh = schema.discriminatedUnion('kind', [
  schema.object({ kind: schema.literal('idle') }).strict(),
  schema.object({ kind: schema.literal('paused') }).strict(),
  schema.object({ kind: schema.literal('refreshing') }).strict(),
  schema.object({ kind: schema.literal('failed'), error: Failure, activity: Activity }).strict(),
])

export const UsersState = schema.discriminatedUnion('kind', [
  schema.object({ kind: schema.literal('awaiting'), activity: Activity }).strict(),
  schema.object({ kind: schema.literal('failed'), error: Failure, activity: Activity }).strict(),
  schema.object({ kind: schema.literal('empty'), refresh: Refresh }).strict(),
  schema.object({ kind: schema.literal('content'), users: schema.tuple([User]).rest(User), refresh: Refresh }).strict(),
])
export type UsersState = Output<typeof UsersState>

