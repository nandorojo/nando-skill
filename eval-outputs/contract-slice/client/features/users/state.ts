import { QuerySnapshot, UsersState } from './schema'
import { type User } from '../../../core/features/users/schema'

// A React Query adapter can create this snapshot. The portable contract itself
// knows nothing about React Query, React, the network transport, or a router.
export function normalizeUsersState(value: QuerySnapshot): UsersState {
  const query = QuerySnapshot.parse(value)
  const activity = query.fetchStatus === 'fetching' ? 'loading' : query.fetchStatus
  if (query.status === 'pending') return { kind: 'awaiting', activity }
  if (query.status === 'error') {
    if (query.data === undefined) return { kind: 'failed', error: query.error, activity }
    return settled(query.data, { kind: 'failed', error: query.error, activity })
  }
  return settled(query.data, {
    kind: query.fetchStatus === 'fetching' ? 'refreshing' : query.fetchStatus,
  })
}

function settled(users: User[], refresh: Extract<UsersState, { kind: 'empty' }>['refresh']): UsersState {
  return UsersState.parse(users.length === 0
    ? { kind: 'empty', refresh }
    : { kind: 'content', users, refresh })
}
