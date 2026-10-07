import type { QueryClient } from '@example/libraries/query/react'
import { setNotesMutationDefaults } from '../features/notes/react/mutation-defaults'
import { setTasksMutationDefaults } from '../features/tasks/react/mutation-defaults'

export function setMutationDefaults(client: QueryClient): void {
  setNotesMutationDefaults(client)
  setTasksMutationDefaults(client)
}
