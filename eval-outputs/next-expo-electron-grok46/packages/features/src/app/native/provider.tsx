'use client'

import { QueryClientProvider } from '@example/libraries/query/react'
import { ClientProvider } from '@example/client-sdk/react'
import { createClient } from '@example/client-sdk'
import { makeQueryClient } from '@example/libraries/query/react'
import { setMutationDefaults } from '@example/client-sdk/react'
import { useRef, type ReactNode } from '@example/libraries/react'

function createNativeQueryClient() {
  const client = makeQueryClient()
  setMutationDefaults(client)
  return client
}

export function NativeAppProvider({ children }: { children: ReactNode }) {
  const queryClient = useRef(createNativeQueryClient()).current
  const productClient = useRef(createClient({ baseUrl: 'https://eval.invalid/api/rpc' })).current
  return (
    <QueryClientProvider client={queryClient}>
      <ClientProvider client={productClient}>{children}</ClientProvider>
    </QueryClientProvider>
  )
}
