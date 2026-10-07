import { environmentManager, makeQueryClient } from '@example/libraries/query/react'
import type { QueryClient } from '@example/libraries/query/react'
import { setMutationDefaults } from '@example/client-sdk/react'

function createConfiguredQueryClient() {
  const client = makeQueryClient()
  setMutationDefaults(client)
  return client
}

let browserClient: QueryClient | undefined

export function getQueryClient() {
  if (environmentManager.isServer()) return createConfiguredQueryClient()
  return browserClient ??= createConfiguredQueryClient()
}
