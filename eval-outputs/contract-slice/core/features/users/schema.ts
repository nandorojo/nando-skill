import { schema, type Output } from '../../../library/schema'

export const UserId = schema.string().min(1)
export const User = schema.object({ id: UserId, name: schema.string().min(1) }).strict()
export type User = Output<typeof User>

export const GetUserInput = schema.object({ id: UserId }).strict()
export type GetUserInput = Output<typeof GetUserInput>

export const GetUserResult = schema.discriminatedUnion('kind', [
  schema.object({ kind: schema.literal('found'), user: User }).strict(),
  schema.object({ kind: schema.literal('unavailable') }).strict(),
])
export type GetUserResult = Output<typeof GetUserResult>

export const UserRecord = User.extend({ teamId: schema.string().min(1) })
export type UserRecord = Output<typeof UserRecord>

export const ScopedUserLookup = GetUserInput.extend({
  scope: schema.object({ teamIds: schema.array(schema.string().min(1)) }).strict(),
})
export type ScopedUserLookup = Output<typeof ScopedUserLookup>

