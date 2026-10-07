'use client'

import { QueryClientProvider } from '@example/libraries/query/react'
import { ClientProvider } from '@example/client-sdk/react'
import { createClient } from '@example/client-sdk'
import { useRef, type ReactNode } from '@example/libraries/react'
import { getQueryClient } from '#features/app/next/query-client'

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  const productClient = useRef(createClient({ baseUrl: '/api/rpc' })).current
  return (
    <QueryClientProvider client={queryClient}>
      <ClientProvider client={productClient}>{children}</ClientProvider>
    </QueryClientProvider>
  )
}
