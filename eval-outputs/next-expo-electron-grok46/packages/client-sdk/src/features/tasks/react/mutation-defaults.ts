import type { QueryClient } from '@example/libraries/query/react'
import { query } from '../../../react/query'

export function setTasksMutationDefaults(client: QueryClient): void {
  client.setMutationDefaults(query.tasks.create.key, {
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: query.tasks.list.key })
    },
  })
  client.setMutationDefaults(query.tasks.update.key, {
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: query.tasks.list.key }),
        client.invalidateQueries({ queryKey: query.tasks.byId.key }),
      ])
    },
  })
}
