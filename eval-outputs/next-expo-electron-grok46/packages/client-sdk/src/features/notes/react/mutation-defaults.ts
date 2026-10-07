import type { QueryClient } from '@example/libraries/query/react'
import { query } from '../../../react/query'

export function setNotesMutationDefaults(client: QueryClient): void {
  client.setMutationDefaults(query.notes.create.key, {
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: query.notes.list.key })
    },
  })
  client.setMutationDefaults(query.notes.update.key, {
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: query.notes.list.key }),
        client.invalidateQueries({ queryKey: query.notes.byId.key }),
      ])
    },
  })
}
