'use client'

import { NoteId } from '@example/core/notes/schema'
import { Schema } from '@example/libraries/effect'
import { useParams } from '@example/libraries/navigation/next'
import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'

export function useRouteNoteId(): InputOf<Query['notes']['byId']>['id'] {
  const params = useParams<{ id: string }>()
  return Schema.decodeUnknownSync(NoteId)({ id: String(params.id) }).id
}
