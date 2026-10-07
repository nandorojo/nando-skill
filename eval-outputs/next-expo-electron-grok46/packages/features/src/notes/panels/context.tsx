'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { PanelsContract } from './contract'

const Context = createContext<PanelsContract | null>(null)

export function PanelsProvider({ value, children }: {
  value: PanelsContract
  children: ReactNode
}) {
  return <Context value={value}>{children}</Context>
}

export function usePanels(): PanelsContract {
  const value = use(Context)
  if (value === null) throw new Error('Panels.Provider is required')
  return value
}
