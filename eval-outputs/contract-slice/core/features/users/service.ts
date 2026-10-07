import { Actor } from '../auth/schema'
import { GetUserInput, GetUserResult, ScopedUserLookup, UserRecord } from './schema'

// Internal capability: intentionally performs NO authorization. Never export it
// through the client SDK or hand it to feature code. The adapter must apply the
// supplied scope as a query predicate; deciding that scope is service policy.
export interface UsersDatabase {
  findById(input: ScopedUserLookup): Promise<UserRecord | undefined>
}

export async function getById(
  db: UsersDatabase,
  actor: Actor,
  input: GetUserInput,
): Promise<GetUserResult> {
  const principal = Actor.parse(actor)
  const request = GetUserInput.parse(input)
  const record = await db.findById(ScopedUserLookup.parse({
    id: request.id,
    scope: { teamIds: principal.teamIds },
  }))
  if (record === undefined) return { kind: 'unavailable' }
  const user = UserRecord.parse(record)
  // Defense in depth: an adapter violating the scoped lookup contract must
  // never cause an unauthorized or mismatched record to escape the service.
  if (user.id !== request.id || !principal.teamIds.includes(user.teamId)) {
    return { kind: 'unavailable' }
  }
  // Explicit output mapping prevents accidental disclosure of DB fields.
  return GetUserResult.parse({ kind: 'found', user: { id: user.id, name: user.name } })
}
