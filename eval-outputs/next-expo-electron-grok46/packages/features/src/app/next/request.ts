import { createClient } from '@example/client-sdk'
import { createQuery } from '@example/client-sdk/react'

const client = createClient({ baseUrl: '/api/rpc' })
const query = createQuery(client)

export function getRequestClient() {
  return client
}

export function getRequestQuery() {
  return query
}

export function reportPrefetchSetupError(error: unknown) {
  console.error('Prefetch setup failed', error)
}
