'use client'

import { QueryClientProvider } from '@example/libraries/query/react'
import { ClientProvider } from '@example/client-sdk/react'
import { createClient } from '@example/client-sdk'
import { makeQueryClient } from '@example/libraries/query/react'
import { setMutationDefaults } from '@example/client-sdk/react'
import { useRef, type ReactNode } from '@example/libraries/react'

function createElectronQueryClient() {
  const client = makeQueryClient()
  setMutationDefaults(client)
  return client
}

export function ElectronAppProvider({ children }: { children: ReactNode }) {
  const queryClient = useRef(createElectronQueryClient()).current
  const productClient = useRef(createClient({ baseUrl: 'app://api/rpc' })).current
  return (
    <QueryClientProvider client={queryClient}>
      <ClientProvider client={productClient}>{children}</ClientProvider>
    </QueryClientProvider>
  )
}
