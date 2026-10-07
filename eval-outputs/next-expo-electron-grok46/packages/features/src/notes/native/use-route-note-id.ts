import { NoteId } from '@example/core/notes/schema'
import { Schema } from '@example/libraries/effect'
import { useLocalSearchParams } from '@example/libraries/navigation/native'
import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'

export function useRouteNoteId(): InputOf<Query['notes']['byId']>['id'] {
  const params = useLocalSearchParams<{ id: string }>()
  return Schema.decodeUnknownSync(NoteId)({ id: String(params.id) }).id
}
