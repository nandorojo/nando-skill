import { useQueryApi } from '@example/client-sdk/react'
import type { Query, ResourceOf } from '@example/client-sdk/react'
import { useQuery } from '@example/libraries/query/react'

type NotesList = Query['notes']['list']

export function useNotesList(): ResourceOf<NotesList> {
  const query = useQueryApi()
  return useQuery(query.notes.list.getOptions(undefined))
}
