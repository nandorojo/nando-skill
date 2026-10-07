'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { Rpc } from '../types'

const RpcContext = createContext<Rpc | null>(null)

export function RpcProvider({ value, children }: { value: Rpc; children: ReactNode }) {
  return <RpcContext value={value}>{children}</RpcContext>
}

export function useRpc(): Rpc {
  const value = use(RpcContext)
  if (value === null) throw new Error('RpcProvider is required')
  return value
}
