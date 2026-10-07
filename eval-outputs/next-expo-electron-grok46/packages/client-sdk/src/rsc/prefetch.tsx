import { dehydrate, HydrationBoundary } from '@example/libraries/query/react'
import type { QueryClient } from '@example/libraries/query/react'
import type { ReactNode } from '@example/libraries/react'
import type { Query } from '../react/query'

type PrefetchContext = {
  client: QueryClient
  query: Query
}

type PrefetchProps = {
  children: ReactNode
  client: QueryClient
  queryApi: Query
  reportSetupError(error: unknown): void
  query(context: PrefetchContext): void | Promise<void>
}

export function Prefetch({
  query: prepare,
  children,
  client,
  queryApi,
  reportSetupError,
}: PrefetchProps) {
  void Promise.resolve(prepare({ client, query: queryApi })).catch(reportSetupError)
  return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
}
