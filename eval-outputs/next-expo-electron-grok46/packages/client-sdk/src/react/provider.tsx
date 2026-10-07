'use client'

import { createContext, use, useMemo, type ReactNode } from '@example/libraries/react'
import type { Client } from '../client'
import { createQuery, type Query } from './query'

const QueryApiContext = createContext<Query | null>(null)

export function ClientProvider({ client, children }: {
  client: Client
  children: ReactNode
}) {
  const query = useMemo(() => createQuery(client), [client])
  return <QueryApiContext value={query}>{children}</QueryApiContext>
}

export function useQueryApi(): Query {
  const value = use(QueryApiContext)
  if (value === null) throw new Error('ClientProvider is required')
  return value
}
