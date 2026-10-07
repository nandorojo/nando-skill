import type { InputOf } from '@example/client-sdk'
import { useQueryApi } from '@example/client-sdk/react'
import type { Query, ResourceOf } from '@example/client-sdk/react'
import { useQuery } from '@example/libraries/query/react'

type NoteRead = Query['notes']['byId']

export function useNoteById(input: InputOf<NoteRead>): ResourceOf<NoteRead> {
  const query = useQueryApi()
  return useQuery(query.notes.byId.getOptions(input))
}
